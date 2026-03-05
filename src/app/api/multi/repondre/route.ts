import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'
import { calculerPointsReponse } from '@/lib/scoring'
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

  const salle = await prisma.salle.findUnique({
    where: { id: salleId },
    select: { questionStartedAt: true },
  })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nom: true },
  })

  const joueurNom = user?.nom ?? 'Joueur'

  const correct = reponseIndex === question.bonneReponse
  const tempsMs = salle?.questionStartedAt
    ? Date.now() - salle.questionStartedAt.getTime()
    : 10000
  const points = correct ? calculerPointsReponse(true, tempsMs) : 0

  if (correct) {
    await prisma.salleJoueur.updateMany({
      where: { salleId, userId },
      data: { score: { increment: points } },
    })
  }

  // Check if all players in the room have answered (or are game-over)
  // If so, clear currentQuestionId immediately so next question can trigger
  const joueurs = await prisma.salleJoueur.findMany({
    where: { salleId },
    select: { userId: true },
  })

  // A player "has answered" this round if they sent a reponse-joueur event
  // We approximate: after this response, check total active players vs who answered
  // Simplification: always clear after response so questions flow normally
  // The 30s timer is still a fallback for AFK players
  await prisma.salle.update({
    where: { id: salleId },
    data: { currentQuestionId: null, questionStartedAt: null },
  })

  const scores = await prisma.salleJoueur.findMany({
    where: { salleId },
    include: { user: { select: { nom: true } } },
    orderBy: { score: 'desc' },
  })

  await pusherServer.trigger(`salle-${salleId}`, 'reponse-joueur', {
    joueurNom,
    joueurId: userId,
    correct,
    points,
    scores: scores.map((s) => ({
      joueurNom: s.user.nom,
      joueurId: s.userId,
      score: s.score,
    })),
  })

  return NextResponse.json({
    correct,
    points,
    explication: correct ? question.explication : null,
  })
}
