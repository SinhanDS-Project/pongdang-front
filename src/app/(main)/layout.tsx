import { AppHeader } from '@layout/app-header'
import type { ReactNode } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="py-8 pb-48 md:p-8">{children}</main>
    </div>
  )
}
