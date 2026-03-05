'use client'

import type { TetrisHandlers } from './TetrisBoard'

interface Props {
  handlers: TetrisHandlers
}

export function MobileControls({ handlers }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 lg:hidden mt-3">
      {/* Bouton rotation */}
      <button
        onTouchStart={(e) => {
          e.preventDefault()
          handlers.rotate()
        }}
        className="w-14 h-14 rounded-full bg-purple-600 text-white text-2xl font-bold active:bg-purple-500 select-none"
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
          className="w-14 h-14 rounded-full bg-blue-600 text-white text-2xl font-bold active:bg-blue-500 select-none"
        >
          ←
        </button>
        <button
          onTouchStart={(e) => {
            e.preventDefault()
            handlers.hardDrop()
          }}
          className="w-14 h-14 rounded-full bg-red-600 text-white text-xl font-bold active:bg-red-500 select-none"
        >
          ↓↓
        </button>
        <button
          onTouchStart={(e) => {
            e.preventDefault()
            handlers.moveRight()
          }}
          className="w-14 h-14 rounded-full bg-blue-600 text-white text-2xl font-bold active:bg-blue-500 select-none"
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
        className="w-14 h-14 rounded-full bg-gray-600 text-white text-2xl font-bold active:bg-gray-500 select-none"
      >
        ↓
      </button>
    </div>
  )
}
