'use client'

import type { NiveauData } from '@/types'

interface Props {
  niveau: NiveauData
  score: number
  blocsPlaces: number
  lines: number
  nextPieceShape?: number[][]
  nextPieceColor?: number
}

const COLORS = [
  '', // 0 = empty
  '#06b6d4', // 1 = I (cyan)
  '#eab308', // 2 = O (yellow)
  '#a855f7', // 3 = T (purple)
  '#22c55e', // 4 = S (green)
  '#ef4444', // 5 = Z (red)
  '#3b82f6', // 6 = J (blue)
  '#f97316', // 7 = L (orange)
]

const CELL_SIZE = 20

export function LevelBanner({ niveau, score, blocsPlaces, lines, nextPieceShape, nextPieceColor }: Props) {
  return (
    <div className="flex w-44 flex-col gap-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-1 text-xs uppercase tracking-widest text-slate-400">Niveau</div>
        <div className="text-2xl font-bold text-indigo-400">{niveau.numero}</div>
        <div className="mt-1 text-xs text-slate-300 leading-tight">{niveau.titre}</div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-1 text-xs uppercase tracking-widest text-slate-400">Score</div>
        <div className="text-xl font-bold text-white">{score.toLocaleString()}</div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-1 text-xs uppercase tracking-widest text-slate-400">Blocs placés</div>
        <div className="text-xl font-bold text-white">{blocsPlaces}</div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-1 text-xs uppercase tracking-widest text-slate-400">Lignes</div>
        <div className="text-xl font-bold text-white">{lines}</div>
      </div>

      {nextPieceShape && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-xs uppercase tracking-widest text-slate-400">Suivante</div>
          <div className="flex flex-col items-center gap-0.5">
            {nextPieceShape.map((row, r) => (
              <div key={r} className="flex gap-0.5">
                {row.map((cell, c) => (
                  <div
                    key={c}
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      backgroundColor: cell ? COLORS[nextPieceColor ?? 1] : 'transparent',
                      borderRadius: 3,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
