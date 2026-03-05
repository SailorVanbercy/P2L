'use client'

interface Props {
  nom: string
  isHost: boolean
  isReady?: boolean
}

export function PlayerCard({ nom, isHost }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
      <div className="h-8 w-8 rounded-full bg-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300">
        {nom.charAt(0).toUpperCase()}
      </div>
      <span className="text-white text-sm font-medium">{nom}</span>
      {isHost && (
        <span className="ml-auto rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400 font-semibold">
          Hote
        </span>
      )}
    </div>
  )
}
