'use client'

interface Props {
  score: number
  blocsPlaces: number
  reussi: boolean
  niveauTitre: string
  onRestart: () => void
  onHome: () => void
}

export function GameOver({ score, blocsPlaces, reussi, niveauTitre, onRestart, onHome }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#12121a] p-8 text-center shadow-2xl">
        <div className={`mb-2 text-5xl font-black ${reussi ? 'text-green-400' : 'text-red-400'}`}>
          {reussi ? 'Bravo !' : 'Game Over'}
        </div>
        <p className="mb-6 text-sm text-slate-400">
          {reussi
            ? `Niveau ${niveauTitre} réussi !`
            : 'Mauvaise réponse — la partie repart de zéro.'}
        </p>

        <div className="mb-6 flex justify-center gap-8">
          <div>
            <div className="text-2xl font-bold text-white">{score.toLocaleString()}</div>
            <div className="text-xs text-slate-400">Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{blocsPlaces}</div>
            <div className="text-xs text-slate-400">Blocs</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onRestart}
            className="rounded-lg bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-500"
          >
            Rejouer ce niveau
          </button>
          <button
            onClick={onHome}
            className="rounded-lg border border-white/10 bg-white/5 py-2.5 font-semibold text-slate-300 transition hover:bg-white/10"
          >
            Choisir un niveau
          </button>
        </div>
      </div>
    </div>
  )
}
