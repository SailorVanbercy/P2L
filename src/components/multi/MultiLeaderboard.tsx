'use client'

interface ScoreEntry {
  joueurNom: string
  joueurId: string
  score: number
}

interface Props {
  scores: ScoreEntry[]
  currentUserId: string
}

export function MultiLeaderboard({ scores, currentUserId }: Props) {
  const sorted = [...scores].sort((a, b) => b.score - a.score)

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">Classement</h3>
      <div className="space-y-2">
        {sorted.map((s, i) => (
          <div
            key={s.joueurId}
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
              s.joueurId === currentUserId ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400 w-5">{i + 1}.</span>
              <span className="text-white">{s.joueurNom}</span>
              {s.joueurId === currentUserId && (
                <span className="text-xs text-indigo-400">(vous)</span>
              )}
            </div>
            <span className="font-mono text-indigo-300">{s.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
