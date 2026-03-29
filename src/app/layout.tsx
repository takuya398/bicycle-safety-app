import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import { Toaster } from '@/components/ui/sonner'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'チャリ安全ナビ',
  description: '自転車の危険地点を共有し、安全な走行を促進するサービスです',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={`${geist.className} min-h-screen bg-gray-50`}>
        <Header />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
