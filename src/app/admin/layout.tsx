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
    <div className="min-h-screen">
      <nav className="border-b border-white/10 backdrop-blur-xl bg-white/5 px-4 py-3 lg:px-8 lg:py-4">
        <div className="flex items-center gap-4 lg:gap-6">
          <span className="font-bold text-sm lg:text-base text-white">Admin</span>
          <Link href="/admin/questions" className="text-xs lg:text-sm text-slate-400 hover:text-white transition-colors">Questions</Link>
          <Link href="/admin/scores" className="text-xs lg:text-sm text-slate-400 hover:text-white transition-colors">Scores</Link>
          <Link href="/play" className="ml-auto text-xs lg:text-sm text-slate-400 hover:text-white transition-colors">← Jeu</Link>
        </div>
      </nav>
      <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  )
}
