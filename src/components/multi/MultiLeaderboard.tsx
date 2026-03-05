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
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Classement</h3>
      <div className="space-y-2">
        {sorted.map((s, i) => (
          <div
            key={s.joueurId}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
              s.joueurId === currentUserId ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-white/5'
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
