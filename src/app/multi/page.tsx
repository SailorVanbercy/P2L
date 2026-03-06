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
    <div className="flex min-h-screen flex-col px-4 py-6 lg:px-8 lg:py-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Mode Multijoueur</h1>
        <Link href="/play" className="backdrop-blur-lg bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm text-slate-300 font-medium transition-colors">
          ← Solo
        </Link>
      </header>

      <div className="mx-auto w-full max-w-md space-y-8">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Creer une salle */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-6 shadow-lg shadow-black/20">
          <h2 className="mb-4 text-lg font-semibold text-white">Creer une salle</h2>
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Niveau</label>
            <select
              value={niveauId}
              onChange={(e) => setNiveauId(Number(e.target.value))}
              className="w-full backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
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
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 py-3 font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Creation...' : 'Creer la salle'}
          </button>
        </div>

        {/* Rejoindre */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-6 shadow-lg shadow-black/20">
          <h2 className="mb-4 text-lg font-semibold text-white">Rejoindre une salle</h2>
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Code de la salle</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="ABC123"
              className="w-full backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-white placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            />
          </div>
          <button
            onClick={rejoindre}
            disabled={loading || code.length !== 6}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 py-3 font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Rejoindre'}
          </button>
        </div>
      </div>
    </div>
  )
}
