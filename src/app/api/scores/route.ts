import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  niveauId: z.number().int().positive(),
  score: z.number().int().min(0),
  blocsPlaces: z.number().int().min(0),
  reussi: z.boolean(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const score = await prisma.score.create({
    data: {
      userId: session.user.id,
      ...parsed.data,
    },
  })

  return NextResponse.json(score, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const niveauId = searchParams.get('niveauId')

  const scores = await prisma.score.findMany({
    where: niveauId ? { niveauId: parseInt(niveauId) } : undefined,
    include: {
      user: { select: { nom: true } },
      niveau: { select: { titre: true, numero: true } },
    },
    orderBy: { score: 'desc' },
    take: 20,
  })

  return NextResponse.json(scores)
}
