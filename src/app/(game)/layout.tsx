import type { ReactNode } from 'react'

export default function GameLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/40 min-h-dvh">
      <main className="h-dvh w-full">{children}</main>
    </div>
  )
}
