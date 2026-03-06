'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, email, password }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Erreur lors de l\'inscription')
      return
    }

    router.push('/login?registered=1')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8 shadow-lg shadow-black/20">
        <h1 className="mb-2 text-center text-2xl lg:text-3xl font-bold text-white">Créer un compte</h1>
        <p className="mb-8 text-center text-sm text-slate-400">Rejoignez Tetris Formation</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Prénom / Nom</label>
            <input
              type="text"
              required
              minLength={2}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
              placeholder="Jean Dupont"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 py-2.5 font-semibold text-white rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Inscription…' : 'Créer le compte'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Déjà inscrit ?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
