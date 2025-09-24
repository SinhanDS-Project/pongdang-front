'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { useMe } from '@/hooks/use-me'

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, status } = useMe()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // SSR 단계와 CSR 첫 렌더링을 동일하게 맞추기 위해 skeleton 반환
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-muted-foreground animate-pulse text-sm">사용자 확인 중…</div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-muted-foreground animate-pulse text-sm">사용자 확인 중…</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.replace('/')
    return null
  }

  if (status === 'authenticated' && user?.role !== 'ADMIN') {
    throw new Error('권한 없음')
  }

  return <>{children}</>
}