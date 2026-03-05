'use client'

import { useState, useEffect } from 'react'
import { LeverMainButton } from './LeverMainButton'

interface QuestionData {
  id: number
  texte: string
  choix: string[]
}

interface Props {
  question: QuestionData
  showLeverMain: boolean
  joueurQuiRepond: string | null
  joueurBloque: string | null
  explication: string | null
  isBloque: boolean
  isRespondeur: boolean
  onLeverMain: () => void
  onRepondre: (index: number) => void
  timerSeconds: number
}

export function QuestionMulti({
  question,
  showLeverMain,
  joueurQuiRepond,
  joueurBloque,
  explication,
  isBloque,
  isRespondeur,
  onLeverMain,
  onRepondre,
  timerSeconds,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null)

  function handleChoice(index: number) {
    if (selected !== null) return
    setSelected(index)
    onRepondre(index)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 lg:p-8">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#12121a] p-4 lg:p-8 shadow-2xl">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            Question Multi
          </span>
          <span className="text-sm font-mono text-yellow-400">{timerSeconds}s</span>
        </div>
        <p className="mb-4 lg:mb-6 text-base lg:text-xl font-bold leading-snug text-white">
          {question.texte}
        </p>

        {/* Phase 1: lever la main */}
        {showLeverMain && !isRespondeur && (
          <div className="flex flex-col items-center gap-4">
            <LeverMainButton
              disabled={false}
              bloque={isBloque}
              onLever={onLeverMain}
            />
            {joueurBloque && (
              <p className="text-sm text-orange-400">{joueurBloque} s&apos;est trompe !</p>
            )}
          </div>
        )}

        {/* Phase 2: someone is responding */}
        {joueurQuiRepond && !isRespondeur && (
          <div className="text-center py-4">
            <p className="text-lg text-yellow-300">{joueurQuiRepond} repond...</p>
          </div>
        )}

        {/* Phase 3: I'm the respondeur — show choices */}
        {isRespondeur && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.choix.map((choix, i) => (
              <button
                key={i}
                onClick={() => handleChoice(i)}
                disabled={selected !== null}
                className={`p-3 lg:p-4 rounded-xl border-2 text-left text-sm lg:text-base font-medium transition-all ${
                  selected === null
                    ? 'border-white/10 bg-white/5 text-white hover:border-blue-500 hover:bg-blue-500/10 cursor-pointer'
                    : selected === i
                      ? 'border-yellow-500 bg-yellow-500/20 text-yellow-300'
                      : 'border-white/5 bg-white/5 text-slate-500'
                }`}
              >
                <span className="mr-2 font-bold text-indigo-400">
                  {String.fromCharCode(65 + i)}.
                </span>
                {choix}
              </button>
            ))}
          </div>
        )}

        {/* Explication after correct answer */}
        {explication && (
          <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            <span className="font-semibold">Bonne reponse ! </span>
            {explication}
          </div>
        )}
      </div>
    </div>
  )
}
