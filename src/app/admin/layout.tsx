import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== 'ADMIN') {
    redirect('/play')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <nav className="border-b border-white/10 bg-white/5 px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="font-bold text-white">Admin</span>
          <Link href="/admin/questions" className="text-sm text-slate-400 hover:text-white">Questions</Link>
          <Link href="/admin/scores" className="text-sm text-slate-400 hover:text-white">Scores</Link>
          <Link href="/play" className="ml-auto text-sm text-slate-400 hover:text-white">← Jeu</Link>
        </div>
      </nav>
      <main className="px-6 py-8">{children}</main>
    </div>
  )
}
