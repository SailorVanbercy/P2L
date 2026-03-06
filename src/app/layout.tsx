import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'

export const metadata: Metadata = {
  title: 'Tetris Formation — Plan d\'affaires',
  description: 'Apprenez le plan d\'affaires en jouant au Tetris',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#0a0a0f] text-slate-200 antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
