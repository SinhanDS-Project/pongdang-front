import type { Metadata } from 'next'

import '@styles/globals.css'

import { ThemeProvider } from '@components/providers/theme-provider'

export const metadata: Metadata = {
  title: '퐁당퐁당',
  description: '출석 · 미니게임 · 포인트 · 기부',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-dvh antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
