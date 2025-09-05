import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/40 h-dvh overflow-hidden">
      <div className="mx-auto flex h-full max-w-4xl items-center justify-center p-4">{children}</div>
    </div>
  )
}
