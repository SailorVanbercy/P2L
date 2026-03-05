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
    const base = 'w-full rounded-xl border-2 p-3 lg:p-4 text-left text-sm lg:text-base font-medium transition-all'
    if (!answered) return `${base} border-white/10 bg-white/5 text-white hover:border-blue-500 hover:bg-blue-500/10 cursor-pointer`
    if (index === question.bonneReponse) return `${base} border-green-500 bg-green-500/20 text-green-300`
    if (index === selected) return `${base} border-red-500 bg-red-500/20 text-red-300`
    return `${base} border-white/5 bg-white/5 text-slate-500`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 lg:p-8">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#12121a] p-4 lg:p-8 shadow-2xl">
        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-400">
          Question
        </div>
        <p className="mb-4 lg:mb-6 text-base lg:text-xl font-bold leading-snug text-white">{question.texte}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
