'use client'

import { useEffect, useRef, useState } from 'react'

const TRACKS = [
  { id: 'tetris', label: 'Tetris Theme', src: '/music/tetris-theme.mp3' },
  { id: 'badman', label: 'Badman Gangsta', src: '/music/badman-gangsta.mp3' },
]

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [trackIndex, setTrackIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.4)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const audio = new Audio(TRACKS[0].src)
    audio.loop = true
    audio.volume = volume
    audioRef.current = audio
    return () => {
      audio.pause()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const wasPlaying = !audio.paused
    audio.pause()
    audio.src = TRACKS[trackIndex].src
    audio.load()
    if (wasPlaying) audio.play().catch(() => {})
  }, [trackIndex])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume
  }, [volume, muted])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().catch(() => {})
      setPlaying(true)
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
      {TRACKS.map((t, i) => (
        <button
          key={t.id}
          onClick={() => setTrackIndex(i)}
          className={`rounded px-2 py-0.5 text-xs transition ${
            trackIndex === i
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {t.label}
        </button>
      ))}

      <button
        onClick={togglePlay}
        className="rounded px-2 py-0.5 text-slate-300 hover:text-white transition"
        title={playing ? 'Pause' : 'Play'}
      >
        {playing ? '⏸' : '▶'}
      </button>

      <button
        onClick={() => setMuted((m) => !m)}
        className="text-slate-300 hover:text-white transition"
        title={muted ? 'Activer le son' : 'Couper le son'}
      >
        {muted ? '🔇' : '🔊'}
      </button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        className="w-16 accent-indigo-500 cursor-pointer"
        title={`Volume : ${Math.round(volume * 100)}%`}
      />
    </div>
  )
}
