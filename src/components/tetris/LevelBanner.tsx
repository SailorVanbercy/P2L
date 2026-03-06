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

const CELL_SIZE = 16

export function LevelBanner({ niveau, score, blocsPlaces, lines, nextPieceShape, nextPieceColor }: Props) {
  return (
    <div className="flex flex-row lg:flex-col gap-3 lg:gap-4 flex-wrap justify-center">
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-3 lg:p-4 min-w-[80px] lg:min-w-[180px] shadow-lg shadow-black/20">
        <div className="mb-1 text-[10px] lg:text-xs font-medium uppercase tracking-wider text-slate-400">Niveau</div>
        <div className="text-lg lg:text-2xl font-bold text-indigo-400">{niveau.numero}</div>
        <div className="mt-1 text-[10px] lg:text-xs text-slate-300 leading-tight hidden lg:block">{niveau.titre}</div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-3 lg:p-4 min-w-[80px] lg:min-w-[180px] shadow-lg shadow-black/20">
        <div className="mb-1 text-[10px] lg:text-xs font-medium uppercase tracking-wider text-slate-400">Score</div>
        <div className="text-base lg:text-xl font-bold text-white">{score.toLocaleString()}</div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-3 lg:p-4 min-w-[80px] lg:min-w-[180px] shadow-lg shadow-black/20">
        <div className="mb-1 text-[10px] lg:text-xs font-medium uppercase tracking-wider text-slate-400">Blocs</div>
        <div className="text-base lg:text-xl font-bold text-white">{blocsPlaces}</div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-3 lg:p-4 min-w-[80px] lg:min-w-[180px] shadow-lg shadow-black/20">
        <div className="mb-1 text-[10px] lg:text-xs font-medium uppercase tracking-wider text-slate-400">Lignes</div>
        <div className="text-base lg:text-xl font-bold text-white">{lines}</div>
      </div>

      {nextPieceShape && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-3 lg:p-4 min-w-[80px] lg:min-w-[180px] shadow-lg shadow-black/20">
          <div className="mb-2 text-[10px] lg:text-xs font-medium uppercase tracking-wider text-slate-400">Suivante</div>
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
                      borderRadius: 4,
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
