'use client'

import { useState } from 'react'
import type { QuestionData } from '@/types'

interface Props {
  question: QuestionData
  onCorrect: () => void
  onWrong: () => void
}

export function QuestionModal({ question, onCorrect, onWrong }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)

  function handleChoice(index: number) {
    if (answered) return
    setSelected(index)
    setAnswered(true)

    if (index === question.bonneReponse) {
      setTimeout(onCorrect, 1200)
    } else {
      setTimeout(onWrong, 1500)
    }
  }

  function getChoiceClass(index: number) {
    const base = 'w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors'
    if (!answered) return `${base} border-white/10 bg-white/5 text-white hover:bg-white/10 cursor-pointer`
    if (index === question.bonneReponse) return `${base} border-green-500 bg-green-500/20 text-green-300`
    if (index === selected) return `${base} border-red-500 bg-red-500/20 text-red-300`
    return `${base} border-white/5 bg-white/5 text-slate-500`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-400">
          Question
        </div>
        <p className="mb-6 text-lg font-semibold leading-snug text-white">{question.texte}</p>

        <div className="flex flex-col gap-3">
          {question.choix.map((choix, i) => (
            <button key={i} className={getChoiceClass(i)} onClick={() => handleChoice(i)}>
              <span className="mr-2 font-bold text-indigo-400">{String.fromCharCode(65 + i)}.</span>
              {choix}
            </button>
          ))}
        </div>

        {answered && question.explication && (
          <div className="mt-4 rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-300">
            <span className="font-semibold text-slate-100">Explication : </span>
            {question.explication}
          </div>
        )}
      </div>
    </div>
  )
}
