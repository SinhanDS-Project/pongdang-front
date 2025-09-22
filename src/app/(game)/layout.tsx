import type { ReactNode } from 'react'

export default function GameLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/40 h-dvh overflow-hidden">
      <div className="flex h-full items-center justify-center p-4">{children}</div>
    </div>
  )
}
