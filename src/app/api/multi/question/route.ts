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

  try {
    const questions = await prisma.question.findMany({
      where: { niveauId: parsed.data.niveauId },
      orderBy: { id: 'asc' },
    })

    if (questions.length === 0) {
      return NextResponse.json({ error: 'Aucune question' }, { status: 404 })
    }

    // Get the current salle state
    const salle = await prisma.salle.findUnique({
      where: { id: parsed.data.salleId },
      select: { currentQuestionId: true, lastQuestionIndex: true },
    })

    // If a question is already active, don't create a new one
    if (salle?.currentQuestionId) {
      return NextResponse.json({ questionId: salle.currentQuestionId })
    }

    // Pick the next question based on lastQuestionIndex (cycle if exhausted)
    const idx = (salle?.lastQuestionIndex ?? 0) % questions.length
    const question = questions[idx]

    // Store current question, advance index, and reset state
    await prisma.salle.update({
      where: { id: parsed.data.salleId },
      data: {
        currentQuestionId: question.id,
        lastQuestionIndex: idx + 1,
        joueurQuiRepond: null,
        questionStartedAt: new Date(),
      },
    })

    // Do NOT include bonneReponse in the Pusher payload
    await pusherServer.trigger(`salle-${parsed.data.salleId}`, 'question-affichee', {
      id: question.id,
      texte: question.texte,
      source: question.source,
      choix: question.choix,
      niveauId: question.niveauId,
      triggeredByUserId: session.user.id,
    })

    return NextResponse.json({ questionId: question.id })
  } catch (err) {
    console.error('[API multi/question] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
