import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'
import { z } from 'zod'

const schema = z.object({
  salleId: z.string(),
  reponseIndex: z.number().int().min(0).max(3),
  questionId: z.number().int().positive(),
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

  const { salleId, reponseIndex, questionId } = parsed.data
  const userId = session.user.id

  const question = await prisma.question.findUnique({
    where: { id: questionId },
  })

  if (!question) {
    return NextResponse.json({ error: 'Question introuvable' }, { status: 404 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nom: true },
  })

  const joueurNom = user?.nom ?? 'Joueur'

  if (reponseIndex === question.bonneReponse) {
    // Correct answer
    await prisma.salleJoueur.updateMany({
      where: { salleId, userId },
      data: { score: { increment: 150 } },
    })

    // Reset joueurQuiRepond and currentQuestionId
    await prisma.salle.update({
      where: { id: salleId },
      data: { joueurQuiRepond: null, currentQuestionId: null },
    })

    const scores = await prisma.salleJoueur.findMany({
      where: { salleId },
      include: { user: { select: { nom: true } } },
      orderBy: { score: 'desc' },
    })

    await pusherServer.trigger(`salle-${salleId}`, 'reponse-correcte', {
      joueurNom,
      explication: question.explication,
      scores: scores.map((s) => ({
        joueurNom: s.user.nom,
        joueurId: s.userId,
        score: s.score,
      })),
    })

    return NextResponse.json({ correct: true })
  } else {
    // Wrong answer — block player for 10s
    await prisma.salleJoueur.updateMany({
      where: { salleId, userId },
      data: { bloque: true },
    })

    // Reset joueurQuiRepond so others can raise hand
    await prisma.salle.update({
      where: { id: salleId },
      data: { joueurQuiRepond: null },
    })

    await pusherServer.trigger(`salle-${salleId}`, 'reponse-incorrecte', {
      joueurNom,
    })

    // Unblock after 5s
    setTimeout(async () => {
      await prisma.salleJoueur.updateMany({
        where: { salleId, userId },
        data: { bloque: false },
      })
    }, 5_000)

    return NextResponse.json({ correct: false })
  }
}
