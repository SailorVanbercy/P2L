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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm backdrop-blur-2xl bg-white/[0.08] border border-white/[0.12] rounded-2xl p-6 lg:p-8 text-center shadow-2xl shadow-black/40">
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
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{blocsPlaces}</div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Blocs</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onRestart}
            className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 py-2.5 font-semibold text-white rounded-xl transition-colors"
          >
            Rejouer ce niveau
          </button>
          <button
            onClick={onHome}
            className="backdrop-blur-lg bg-white/5 border border-white/10 hover:bg-white/10 py-2.5 font-medium text-slate-300 rounded-xl transition-colors"
          >
            Choisir un niveau
          </button>
        </div>
      </div>
    </div>
  )
}
