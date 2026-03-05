'use client'

interface Props {
  disabled: boolean
  bloque: boolean
  onLever: () => void
}

export function LeverMainButton({ disabled, bloque, onLever }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onLever}
        disabled={disabled || bloque}
        className={`rounded-2xl px-8 py-4 text-2xl font-bold transition-all ${
          disabled || bloque
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-yellow-500 text-black hover:bg-yellow-400 active:scale-95'
        }`}
      >
        ✋ Lever la main
      </button>
      {bloque && (
        <p className="text-sm text-red-400">Vous etes bloque temporairement (5s)</p>
      )}
    </div>
  )
}
