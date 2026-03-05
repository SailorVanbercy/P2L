import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  niveauId: z.number().int().positive(),
})

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

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

  // Generate unique code
  let code = generateCode()
  let exists = await prisma.salle.findUnique({ where: { code } })
  while (exists) {
    code = generateCode()
    exists = await prisma.salle.findUnique({ where: { code } })
  }

  const salle = await prisma.salle.create({
    data: {
      code,
      niveauId: parsed.data.niveauId,
      hostId: session.user.id,
      joueurs: {
        create: {
          userId: session.user.id,
        },
      },
    },
  })

  return NextResponse.json({ code: salle.code, salleId: salle.id })
}
