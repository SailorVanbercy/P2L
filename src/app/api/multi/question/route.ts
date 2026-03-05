import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'
import { z } from 'zod'

const schema = z.object({
  salleId: z.string(),
  niveauId: z.number().int().positive(),
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

  const questions = await prisma.question.findMany({
    where: { niveauId: parsed.data.niveauId },
    orderBy: { id: 'asc' },
  })

  if (questions.length === 0) {
    return NextResponse.json({ error: 'Aucune question' }, { status: 404 })
  }

  // Get the current salle to find the last question
  const salle = await prisma.salle.findUnique({
    where: { id: parsed.data.salleId },
    select: { currentQuestionId: true },
  })

  // If a question is already active, don't create a new one
  if (salle?.currentQuestionId) {
    return NextResponse.json({ questionId: salle.currentQuestionId })
  }

  // Pick the first question (currentQuestionId is null here, cleared after each round)
  const question = questions[0]

  // Store current question, timestamp, and reset joueurQuiRepond
  await prisma.salle.update({
    where: { id: parsed.data.salleId },
    data: {
      currentQuestionId: question.id,
      joueurQuiRepond: null,
      questionStartedAt: new Date(),
    },
  })

  // Do NOT include bonneReponse in the Pusher payload
  await pusherServer.trigger(`salle-${parsed.data.salleId}`, 'question-affichee', {
    id: question.id,
    texte: question.texte,
    choix: question.choix,
    niveauId: question.niveauId,
    triggeredByUserId: session.user.id,
  })

  return NextResponse.json({ questionId: question.id })
}
