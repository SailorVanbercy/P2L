'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { getPusherClient } from '@/lib/pusherClient'
import { PlayerCard } from '@/components/multi/PlayerCard'
import Link from 'next/link'

interface SalleInfo {
  id: string
  code: string
  hostId: string
  niveauId: number
  statut: string
  joueurs: { userId: string; user: { nom: string } }[]
  niveau: { numero: number; titre: string }
}

export default function SalleAttentePage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [salle, setSalle] = useState<SalleInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  // Fetch salle info
  useEffect(() => {
    async function load() {
      // Join the salle (idempotent if already joined)
      const joinRes = await fetch('/api/multi/rejoindre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      if (!joinRes.ok) {
        const data = await joinRes.json()
        setError(data.error || 'Erreur')
        setLoading(false)
        return
      }

      const { salleId } = await joinRes.json()

      // Fetch full salle info
      const res = await fetch(`/api/multi/salle/${code}`)
      if (res.ok) {
        const data = await res.json()
        setSalle(data)
      }
      setLoading(false)
    }
    load()
  }, [code])

  // Listen for Pusher events
  useEffect(() => {
    if (!salle) return

    const pusher = getPusherClient()
    const channel = pusher.subscribe(`salle-${salle.id}`)

    channel.bind('joueur-rejoint', (data: { joueurNom: string; joueurId: string }) => {
      setSalle((prev) => {
        if (!prev) return prev
        const alreadyExists = prev.joueurs.some((j) => j.userId === data.joueurId)
        if (alreadyExists) return prev
        return {
          ...prev,
          joueurs: [...prev.joueurs, { userId: data.joueurId, user: { nom: data.joueurNom } }],
        }
      })
    })

    channel.bind('partie-demarree', () => {
      router.push(`/multi/${code}/play`)
    })

    return () => {
      pusher.unsubscribe(`salle-${salle.id}`)
    }
  }, [salle, code, router])

  async function demarrer() {
    if (!salle) return
    setStarting(true)
    await fetch('/api/multi/demarrer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salleId: salle.id }),
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <p className="text-slate-400">Chargement...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] gap-4">
        <p className="text-red-400">{error}</p>
        <Link href="/multi" className="text-indigo-400 hover:underline">← Retour</Link>
      </div>
    )
  }

  if (!salle) return null

  const isHost = session?.user?.id === salle.hostId

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0f] px-4 py-6 lg:px-6 lg:py-8">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/multi" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs lg:text-sm text-slate-300 hover:bg-white/10">
          ← Retour
        </Link>
        <span className="text-sm text-slate-400">
          Niveau {salle.niveau.numero} — {salle.niveau.titre}
        </span>
      </header>

      <div className="mx-auto w-full max-w-md text-center">
        {/* Code de salle */}
        <div className="mb-8">
          <p className="mb-2 text-sm text-slate-400">Code de la salle</p>
          <div className="inline-block rounded-2xl border-2 border-indigo-500/30 bg-indigo-500/10 px-8 py-4">
            <span className="text-4xl lg:text-5xl font-black tracking-[0.3em] text-indigo-300">
              {salle.code}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Partagez ce code avec les autres joueurs</p>
        </div>

        {/* Liste des joueurs */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Joueurs ({salle.joueurs.length})
          </h2>
          <div className="space-y-2">
            {salle.joueurs.map((j) => (
              <PlayerCard
                key={j.userId}
                nom={j.user.nom}
                isHost={j.userId === salle.hostId}
              />
            ))}
          </div>
        </div>

        {/* Bouton demarrer */}
        {isHost ? (
          <button
            onClick={demarrer}
            disabled={starting || salle.joueurs.length < 1}
            className="w-full rounded-lg bg-green-600 py-4 text-lg font-bold text-white transition hover:bg-green-500 disabled:opacity-50"
          >
            {starting ? 'Demarrage...' : 'Demarrer la partie'}
          </button>
        ) : (
          <p className="text-slate-400">En attente du demarrage par l&apos;hote...</p>
        )}
      </div>
    </div>
  )
}
