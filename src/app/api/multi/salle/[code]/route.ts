import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const { code } = await params

  const salle = await prisma.salle.findUnique({
    where: { code },
    include: {
      joueurs: {
        include: { user: { select: { nom: true } } },
      },
      niveau: { select: { numero: true, titre: true } },
    },
  })

  if (!salle) {
    return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 })
  }

  return NextResponse.json(salle)
}
