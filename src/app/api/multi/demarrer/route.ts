import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'
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

  const salle = await prisma.salle.findUnique({
    where: { id: parsed.data.salleId },
  })

  if (!salle) {
    return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 })
  }

  if (salle.hostId !== session.user.id) {
    return NextResponse.json({ error: 'Seul l\'hote peut demarrer' }, { status: 403 })
  }

  await prisma.salle.update({
    where: { id: salle.id },
    data: { statut: 'EN_JEU' },
  })

  await pusherServer.trigger(`salle-${salle.id}`, 'partie-demarree', {})

  return NextResponse.json({ ok: true })
}
