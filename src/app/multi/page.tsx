'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MultiPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [niveauId, setNiveauId] = useState(1)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function creerSalle() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/multi/salle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niveauId }),
    })
    const data = await res.json()
    if (res.ok) {
      router.push(`/multi/${data.code}`)
    } else {
      setError(data.error || 'Erreur')
    }
    setLoading(false)
  }

  async function rejoindre() {
    if (code.length !== 6) {
      setError('Le code doit faire 6 caracteres')
      return
    }
    setLoading(true)
    setError('')
    const res = await fetch('/api/multi/rejoindre', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.toUpperCase() }),
    })
    const data = await res.json()
    if (res.ok) {
      router.push(`/multi/${code.toUpperCase()}`)
    } else {
      setError(data.error || 'Erreur')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0f] px-4 py-6 lg:px-6 lg:py-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold text-white">Mode Multijoueur</h1>
        <Link href="/play" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm text-slate-300 hover:bg-white/10">
          ← Solo
        </Link>
      </header>

      <div className="mx-auto w-full max-w-md space-y-8">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Creer une salle */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Creer une salle</h2>
          <div className="mb-4">
            <label className="mb-2 block text-sm text-slate-400">Niveau</label>
            <select
              value={niveauId}
              onChange={(e) => setNiveauId(Number(e.target.value))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
            >
              {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n} className="bg-gray-900">
                  Niveau {n}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={creerSalle}
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Creation...' : 'Creer la salle'}
          </button>
        </div>

        {/* Rejoindre */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Rejoindre une salle</h2>
          <div className="mb-4">
            <label className="mb-2 block text-sm text-slate-400">Code de la salle</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="ABC123"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-center text-2xl font-mono tracking-widest text-white placeholder:text-slate-600"
            />
          </div>
          <button
            onClick={rejoindre}
            disabled={loading || code.length !== 6}
            className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Rejoindre'}
          </button>
        </div>
      </div>
    </div>
  )
}
