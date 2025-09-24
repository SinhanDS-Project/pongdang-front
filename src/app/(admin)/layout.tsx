import type { Metadata } from 'next'
// import { GeistSans } from 'geist/font/sans'
// import { GeistMono } from 'geist/font/mono'
// import { Analytics } from '@vercel/analytics/next'
import '@styles/globals.css'

export const metadata: Metadata = {
  title: 'Pongdang Admin',
  description: 'Created with v0',
  generator: 'v0.app',
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
      <main>
        {children}
        {/* <Analytics /> */}
      </main>
  )
}
