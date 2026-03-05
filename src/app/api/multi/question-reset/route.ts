import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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

  // Clear question state so the next threshold can trigger a new question
  await prisma.salle.update({
    where: { id: parsed.data.salleId },
    data: { currentQuestionId: null, questionStartedAt: null, joueurQuiRepond: null },
  })

  return NextResponse.json({ ok: true })
}
