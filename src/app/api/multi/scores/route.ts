import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const salleId = searchParams.get('salleId')

  if (!salleId) {
    return NextResponse.json({ error: 'salleId requis' }, { status: 400 })
  }

  const scores = await prisma.salleJoueur.findMany({
    where: { salleId },
    include: { user: { select: { nom: true } } },
    orderBy: { score: 'desc' },
  })

  return NextResponse.json(
    scores.map((s) => ({
      joueurNom: s.user.nom,
      joueurId: s.userId,
      score: s.score,
      bloque: s.bloque,
    }))
  )
}
