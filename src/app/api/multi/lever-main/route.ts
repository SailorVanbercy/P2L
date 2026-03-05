import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'
import { z } from 'zod'

const schema = z.object({
  salleId: z.string(),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 })
  }

  const { salleId } = parsed.data
  const userId = session.user.id

  try {
    const result = await prisma.$transaction(async (tx) => {
      const salle = await tx.salle.findUnique({
        where: { id: salleId },
        select: { joueurQuiRepond: true, currentQuestionId: true },
      })

      if (!salle) throw new Error('SALLE_NOT_FOUND')
      if (salle.joueurQuiRepond) throw new Error('DEJA_PRIS')

      const salleJoueur = await tx.salleJoueur.findFirst({
        where: { salleId, userId },
      })

      if (!salleJoueur) throw new Error('JOUEUR_NOT_FOUND')
      if (salleJoueur.bloque) throw new Error('JOUEUR_BLOQUE')

      await tx.salle.update({
        where: { id: salleId },
        data: { joueurQuiRepond: userId },
      })

      let question = null
      if (salle.currentQuestionId) {
        question = await tx.question.findUnique({
          where: { id: salle.currentQuestionId },
          select: { id: true, texte: true, choix: true, niveauId: true },
        })
      }

      return { question }
    })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { nom: true },
    })

    await pusherServer.trigger(`salle-${salleId}`, 'main-levee', {
      joueurNom: user?.nom ?? 'Joueur',
      joueurId: userId,
      question: result.question,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur'
    if (message === 'DEJA_PRIS') {
      return NextResponse.json({ error: 'Un autre joueur a deja leve la main' }, { status: 409 })
    }
    if (message === 'JOUEUR_BLOQUE') {
      return NextResponse.json({ error: 'Joueur bloque' }, { status: 403 })
    }
    if (message === 'JOUEUR_NOT_FOUND') {
      return NextResponse.json({ error: 'Joueur non trouve dans la salle' }, { status: 404 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
