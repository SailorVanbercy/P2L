import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PlayClient } from './PlayClient'

export default async function PlayPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const [niveaux, scoresReussis] = await Promise.all([
    prisma.niveau.findMany({ orderBy: { numero: 'asc' } }),
    prisma.score.findMany({
      where: { userId: session.user.id, reussi: true },
      select: { niveauId: true },
      distinct: ['niveauId'],
    }),
  ])

  const niveauxReussisIds = scoresReussis.map((s) => s.niveauId)

  return <PlayClient niveaux={niveaux} niveauxReussisIds={niveauxReussisIds} />
}
