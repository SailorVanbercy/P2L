'use client'

import { useState, useEffect } from 'react'

interface QuestionData {
  id: number
  texte: string
  source?: string | null
  choix: string[]
}

interface ReponseJoueur {
  joueurNom: string
  joueurId: string
  correct: boolean
  points: number
  explication: string | null
}

interface Props {
  question: QuestionData
  canAnswer: boolean
  countdown: number
  reponses: ReponseJoueur[]
  onRepondre: (index: number) => void
  timerSeconds: number
}

export function QuestionMulti({
  question,
  canAnswer,
  countdown,
  reponses,
  onRepondre,
  timerSeconds,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [showSource, setShowSource] = useState(false)

  // Reset selection and source when question changes
  useEffect(() => {
    setSelected(null)
    setShowSource(false)
  }, [question.id])

  function handleChoice(index: number) {
    if (selected !== null || !canAnswer) return
    setSelected(index)
    onRepondre(index)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 lg:p-8">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto backdrop-blur-2xl bg-white/[0.08] border border-white/[0.12] rounded-2xl p-4 lg:p-8 shadow-2xl shadow-black/40">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Question Multi
          </span>
          <span className="text-sm font-mono text-amber-400">{timerSeconds}s</span>
        </div>
        <p className="mb-4 lg:mb-6 text-base lg:text-xl font-bold leading-snug text-white">
          {question.texte}
        </p>

        {/* Source text — collapsible */}
        {question.source && (
          <div className="mb-4">
            <button
              onClick={() => setShowSource(!showSource)}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span>{showSource ? '▼' : '▶'}</span>
              Consulter la source
            </button>
            {showSource && (
              <div className="mt-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 text-sm leading-relaxed text-slate-300">
                {question.source}
              </div>
            )}
          </div>
        )}

        {/* Countdown before answers unlock */}
        {!canAnswer && selected === null && countdown > 0 && (
          <p className="mb-3 text-center text-sm font-semibold text-amber-400">
            Reponses disponibles dans {countdown}s...
          </p>
        )}

        {/* Answer choices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {question.choix.map((choix, i) => (
            <button
              key={i}
              onClick={() => handleChoice(i)}
              disabled={selected !== null || !canAnswer}
              className={`p-3 lg:p-4 rounded-xl border-2 text-left text-sm lg:text-base font-medium transition-all ${
                selected === null && canAnswer
                  ? 'border-white/10 bg-white/5 text-white hover:border-indigo-500/50 hover:bg-indigo-500/10 cursor-pointer'
                  : selected === i
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                    : selected !== null
                      ? 'border-white/5 bg-white/[0.03] text-slate-500'
                      : 'border-white/5 bg-white/[0.03] text-slate-500 cursor-not-allowed'
              }`}
            >
              <span className="mr-2 font-bold text-indigo-400">
                {String.fromCharCode(65 + i)}.
              </span>
              {choix}
            </button>
          ))}
        </div>

        {/* Player responses feed */}
        {reponses.length > 0 && (
          <div className="mt-3 space-y-1">
            {reponses.map((r, i) => (
              <p key={i} className={`text-sm ${r.correct ? 'text-green-400' : 'text-red-400'}`}>
                {r.joueurNom} {r.correct ? `a trouve ! (+${r.points} pts)` : 's\'est trompe !'}
              </p>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
