'use client'

import { useState } from 'react'
import { TetrisBoard } from '@/components/tetris/TetrisBoard'
import { MusicPlayer } from '@/components/tetris/MusicPlayer'
import type { NiveauData, QuestionData } from '@/types'
import { signOut, useSession } from 'next-auth/react'

interface Props {
  niveaux: NiveauData[]
  niveauxReussisIds: number[]
}

export function PlayClient({ niveaux, niveauxReussisIds }: Props) {
  const { data: session } = useSession()
  const [selectedNiveau, setSelectedNiveau] = useState<NiveauData | null>(null)
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [loadingQ, setLoadingQ] = useState(false)
  const [gameKey, setGameKey] = useState(0)
  const [completedIds, setCompletedIds] = useState<number[]>(niveauxReussisIds)

  function isUnlocked(niveau: NiveauData): boolean {
    if (niveau.numero === 1) return true
    const prev = niveaux.find((n) => n.numero === niveau.numero - 1)
    if (!prev) return true
    return completedIds.includes(prev.id)
  }

  function handleVictory(niveauId: number) {
    setCompletedIds((ids) => (ids.includes(niveauId) ? ids : [...ids, niveauId]))
  }

  async function selectNiveau(niveau: NiveauData) {
    if (!isUnlocked(niveau)) return
    setLoadingQ(true)
    const res = await fetch(`/api/questions?niveauId=${niveau.id}`)
    const data = await res.json()
    setQuestions(data)
    setSelectedNiveau(niveau)
    setGameKey((k) => k + 1)
    setLoadingQ(false)
  }

  if (selectedNiveau && questions.length > 0) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0a0a0f] px-6 py-6">
        <header className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <button
            onClick={() => setSelectedNiveau(null)}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
          >
            ← Niveaux
          </button>
          <MusicPlayer />
          <span className="text-sm text-slate-400">
            Connecté : <span className="text-white">{session?.user?.name}</span>
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
          >
            Déconnexion
          </button>
        </header>

        <div className="flex flex-1 items-start justify-center pt-4">
          <TetrisBoard
            key={gameKey}
            niveau={selectedNiveau}
            questions={questions}
            onVictory={handleVictory}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0f] px-6 py-8">
      <header className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-white">Tetris Formation</h1>
        <MusicPlayer />
        <div className="flex items-center gap-4">
          <a href="/leaderboard" className="text-sm text-indigo-400 hover:underline">
            Classement
          </a>
          <span className="text-sm text-slate-400">{session?.user?.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl">
        <h2 className="mb-6 text-xl font-semibold text-slate-200">Choisissez un niveau</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {niveaux.map((n) => {
            const unlocked = isUnlocked(n)
            const done = completedIds.includes(n.id)
            return (
              <button
                key={n.id}
                onClick={() => selectNiveau(n)}
                disabled={!unlocked || loadingQ}
                title={!unlocked ? `Complétez le niveau ${n.numero - 1} d'abord` : undefined}
                className={`relative flex flex-col items-center rounded-xl border p-5 text-center transition ${
                  unlocked
                    ? 'border-white/10 bg-white/5 hover:border-indigo-500 hover:bg-indigo-500/10'
                    : 'cursor-not-allowed border-white/5 bg-white/[0.02] opacity-50'
                } disabled:cursor-not-allowed`}
              >
                {done && (
                  <span className="absolute right-2 top-2 text-xs text-green-400">✓</span>
                )}
                {!unlocked && (
                  <span className="absolute right-2 top-2 text-xs text-slate-500">🔒</span>
                )}
                <span
                  className={`mb-2 text-3xl font-black ${unlocked ? 'text-indigo-400' : 'text-slate-600'}`}
                >
                  {n.numero}
                </span>
                <span className="text-xs font-medium leading-tight text-slate-300">{n.titre}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-10 rounded-xl border border-white/5 bg-white/5 p-5 text-sm text-slate-400">
          <p className="mb-1 font-semibold text-slate-200">Comment jouer</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>← → : déplacer la pièce</li>
            <li>↑ ou X : tourner</li>
            <li>↓ : descendre doucement</li>
            <li>Espace : chute rapide</li>
            <li>Tous les {5} blocs posés, une question apparaît.</li>
            <li>Réponds à toutes les questions pour valider le niveau.</li>
            <li>Mauvaise réponse = partie perdue et score réinitialisé.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
