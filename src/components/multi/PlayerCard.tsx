'use client'

interface Props {
  nom: string
  isHost: boolean
  isReady?: boolean
}

export function PlayerCard({ nom, isHost }: Props) {
  return (
    <div className="flex items-center gap-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl px-4 py-3 transition-colors hover:bg-white/[0.08]">
      <div className="h-8 w-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300">
        {nom.charAt(0).toUpperCase()}
      </div>
      <span className="text-white text-sm font-medium">{nom}</span>
      {isHost && (
        <span className="ml-auto rounded-full bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 text-xs text-amber-400 font-semibold">
          Hote
        </span>
      )}
    </div>
  )
}
