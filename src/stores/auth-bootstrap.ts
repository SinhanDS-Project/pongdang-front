'use client'
import { useEffect } from 'react'

import { revalidateMe } from '@/hooks/use-me'

import { tokenStore } from '@/stores/token-store'

export default function AuthBootstrapClient() {
  useEffect(() => {
    // 1) 토큰 로컬스토리지 → 메모리
    tokenStore.hydrateFromStorage()

    // 2) 토큰 변화 감지 시에만 /me 재검증
    const unsub = tokenStore.subscribe(() => {
      revalidateMe()
    })

    // 3) 다른 탭에서 토큰 바뀌면 재검증
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'access_token') revalidateMe()
    }
    window.addEventListener('storage', onStorage)

    // ✅ 포커스 핸들러 제거 (리렌더 원인 삭제)
    return () => {
      unsub()
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return null
}
