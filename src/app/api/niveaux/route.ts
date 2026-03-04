import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const niveaux = await prisma.niveau.findMany({
    orderBy: { numero: 'asc' },
  })
  return NextResponse.json(niveaux)
}
