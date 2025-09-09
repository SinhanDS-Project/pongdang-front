'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { useAuth } from '@components/providers/auth-provider'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (auth && auth.status === 'unauthenticated') router.replace('/')
  }, [auth, router])

  if (!auth || auth.status === 'loading') {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-muted-foreground animate-pulse text-sm">사용자 확인 중…</div>
      </div>
    )
  }
  if (auth.status === 'unauthenticated') return null

  return <>{children}</>
}
