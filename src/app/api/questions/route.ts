import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const niveauId = searchParams.get('niveauId')

  const questions = await prisma.question.findMany({
    where: niveauId ? { niveauId: parseInt(niveauId) } : undefined,
    orderBy: { id: 'asc' },
  })

  return NextResponse.json(questions)
}
