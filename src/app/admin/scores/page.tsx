import { prisma } from '@/lib/prisma'

export default async function AdminScoresPage() {
  const scores = await prisma.score.findMany({
    include: {
      user: { select: { nom: true, email: true } },
      niveau: { select: { titre: true, numero: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-8 text-2xl font-bold text-white">Tous les scores</h1>

      <div className="rounded-xl border border-white/10 bg-white/5 overflow-x-auto">
        <table className="w-full text-xs lg:text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-widest text-slate-500">
              <th className="px-4 py-3">Joueur</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Niveau</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Blocs</th>
              <th className="px-4 py-3">Résultat</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {scores.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Aucun score enregistré.
                </td>
              </tr>
            )}
            {scores.map((s) => (
              <tr key={s.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 text-white">{s.user.nom}</td>
                <td className="px-4 py-3 text-slate-400">{s.user.email}</td>
                <td className="px-4 py-3 text-slate-300">
                  {s.niveau.numero}. {s.niveau.titre}
                </td>
                <td className="px-4 py-3 font-mono text-indigo-300">{s.score.toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-300">{s.blocsPlaces}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.reussi ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {s.reussi ? 'Réussi' : 'Échoué'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {new Date(s.createdAt).toLocaleString('fr-BE')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
