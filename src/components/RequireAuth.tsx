'use client'

import { useAuthStatus } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const status = useAuthStatus()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-muted-foreground animate-pulse text-sm">사용자 확인 중…</div>
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  return <>{children}</>
}
