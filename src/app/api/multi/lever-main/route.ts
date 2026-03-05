import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'
import { z } from 'zod'

const schema = z.object({
  salleId: z.string(),
})

// In-memory lock for "first to raise hand" per salle
const mainLevee = new Map<string, string>()

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

  const { salleId } = parsed.data
  const userId = session.user.id

  // Check if player is blocked
  const joueur = await prisma.salleJoueur.findFirst({
    where: { salleId, userId },
  })

  if (!joueur) {
    return NextResponse.json({ error: 'Joueur non trouve dans la salle' }, { status: 404 })
  }

  if (joueur.bloque) {
    return NextResponse.json({ error: 'Joueur bloque' }, { status: 403 })
  }

  // Check if someone already raised their hand
  if (mainLevee.has(salleId)) {
    return NextResponse.json({ error: 'Un autre joueur a deja leve la main' }, { status: 409 })
  }

  // Lock
  mainLevee.set(salleId, userId)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nom: true },
  })

  await pusherServer.trigger(`salle-${salleId}`, 'main-levee', {
    joueurNom: user?.nom ?? 'Joueur',
    joueurId: userId,
  })

  return NextResponse.json({ ok: true })
}

// Export to allow clearing from repondre route
export { mainLevee }
