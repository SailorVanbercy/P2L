'use client'

import type { TetrisHandlers } from './TetrisBoard'

interface Props {
  handlers: TetrisHandlers
}

export function MobileControls({ handlers }: Props) {
  return (
    <div className="flex flex-col items-center gap-2.5 lg:hidden mt-3">
      {/* Bouton rotation */}
      <button
        onTouchStart={(e) => {
          e.preventDefault()
          handlers.rotate()
        }}
        className="w-14 h-14 rounded-full backdrop-blur-lg bg-indigo-600/80 border border-indigo-400/20 text-white text-2xl font-bold active:bg-indigo-500 select-none shadow-lg shadow-indigo-500/20 transition-colors"
      >
        ↻
      </button>

      {/* Ligne gauche + chute rapide + droite */}
      <div className="flex gap-4">
        <button
          onTouchStart={(e) => {
            e.preventDefault()
            handlers.moveLeft()
          }}
          className="w-14 h-14 rounded-full backdrop-blur-lg bg-white/10 border border-white/15 text-white text-2xl font-bold active:bg-white/20 select-none transition-colors"
        >
          ←
        </button>
        <button
          onTouchStart={(e) => {
            e.preventDefault()
            handlers.hardDrop()
          }}
          className="w-14 h-14 rounded-full backdrop-blur-lg bg-indigo-500/60 border border-indigo-400/20 text-white text-xl font-bold active:bg-indigo-400/80 select-none shadow-lg shadow-indigo-500/15 transition-colors"
        >
          ↓↓
        </button>
        <button
          onTouchStart={(e) => {
            e.preventDefault()
            handlers.moveRight()
          }}
          className="w-14 h-14 rounded-full backdrop-blur-lg bg-white/10 border border-white/15 text-white text-2xl font-bold active:bg-white/20 select-none transition-colors"
        >
          →
        </button>
      </div>

      {/* Chute douce */}
      <button
        onTouchStart={(e) => {
          e.preventDefault()
          handlers.softDrop()
        }}
        className="w-14 h-14 rounded-full backdrop-blur-lg bg-white/10 border border-white/15 text-white text-2xl font-bold active:bg-white/20 select-none transition-colors"
      >
        ↓
      </button>
    </div>
  )
}
