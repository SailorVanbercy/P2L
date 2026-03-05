import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'
import { z } from 'zod'

const schema = z.object({
  code: z.string().length(6),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Code invalide' }, { status: 400 })
  }

  const salle = await prisma.salle.findUnique({
    where: { code: parsed.data.code },
    include: { joueurs: true },
  })

  if (!salle) {
    return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 })
  }

  if (salle.statut !== 'ATTENTE') {
    return NextResponse.json({ error: 'Partie deja en cours' }, { status: 400 })
  }

  // Check if already joined
  const alreadyJoined = salle.joueurs.some((j) => j.userId === session.user.id)
  if (!alreadyJoined) {
    await prisma.salleJoueur.create({
      data: {
        salleId: salle.id,
        userId: session.user.id,
      },
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { nom: true },
  })

  await pusherServer.trigger(`salle-${salle.id}`, 'joueur-rejoint', {
    joueurNom: user?.nom ?? 'Joueur',
    joueurId: session.user.id,
  })

  return NextResponse.json({ salleId: salle.id, code: salle.code })
}
