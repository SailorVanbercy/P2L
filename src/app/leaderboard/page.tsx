import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const niveaux = await prisma.niveau.findMany({ orderBy: { numero: 'asc' } })

  const scores = await prisma.score.findMany({
    include: {
      user: { select: { nom: true } },
      niveau: { select: { titre: true, numero: true } },
    },
    orderBy: { score: 'desc' },
    take: 50,
  })

  const topByNiveau = niveaux.map((n) => {
    const niveauScores = scores
      .filter((s) => s.niveauId === n.id)
      .slice(0, 5)
    return { niveau: n, scores: niveauScores }
  })

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
      <header className="mb-6 lg:mb-8 flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Classement</h1>
        <Link href="/play" className="backdrop-blur-lg bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm text-slate-300 font-medium transition-colors">
          ← Jouer
        </Link>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 lg:space-y-8">
        {topByNiveau.map(({ niveau, scores: nScores }) => (
          <div key={niveau.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-6 shadow-lg shadow-black/20">
            <h2 className="mb-3 lg:mb-4 text-base lg:text-lg font-semibold text-white">
              <span className="mr-2 text-indigo-400">Niveau {niveau.numero}</span>
              <span className="text-slate-400 text-xs lg:text-sm font-normal">{niveau.titre}</span>
            </h2>

            {nScores.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun score enregistre.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs lg:text-sm">
                  <thead>
                    <tr className="text-left text-[10px] lg:text-xs font-medium uppercase tracking-wider text-slate-500">
                      <th className="pb-2 pr-3 lg:pr-4">#</th>
                      <th className="pb-2 pr-3 lg:pr-4">Joueur</th>
                      <th className="pb-2 pr-3 lg:pr-4">Score</th>
                      <th className="pb-2 pr-3 lg:pr-4 hidden sm:table-cell">Blocs</th>
                      <th className="pb-2">Resultat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nScores.map((s, i) => (
                      <tr key={s.id} className="border-t border-white/5">
                        <td className="py-2 pr-3 lg:pr-4 font-bold text-slate-400">{i + 1}</td>
                        <td className="py-2 pr-3 lg:pr-4 text-white">{s.user.nom}</td>
                        <td className="py-2 pr-3 lg:pr-4 font-mono text-indigo-300">{s.score.toLocaleString()}</td>
                        <td className="py-2 pr-3 lg:pr-4 text-slate-300 hidden sm:table-cell">{s.blocsPlaces}</td>
                        <td className="py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.reussi ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {s.reussi ? 'Reussi' : 'Echoue'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
