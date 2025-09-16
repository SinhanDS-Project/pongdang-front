'use client'

import { tokenStore } from '@/lib/auth/token-store'
import { useAuthStore } from '@/stores/auth-store'
import { useEffect, useRef } from 'react'

export function useAuthBootstrap() {
  const loadMe = useAuthStore((s) => s.loadMe)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true

    // 토큰 초기화(로컬스토리지 → 메모리)
    tokenStore.hydrateFromStorage()

    // 최초 로드
    loadMe()

    // 같은 탭에서 토큰 바뀌면 재로딩
    const unsubToken = tokenStore.subscribe(loadMe)

    // 다른 탭에서 토큰 바뀌면 재로딩
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'access_token') loadMe()
    }
    window.addEventListener('storage', onStorage)

    // 탭 포커스 시 재검증(세션 만료 등)
    const onFocus = () => loadMe()
    window.addEventListener('focus', onFocus)

    return () => {
      mounted.current = false
      unsubToken()
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
    }
  }, [loadMe])
}

export default function AuthBootstrapClient() {
  useAuthBootstrap()
  return null // 화면에 뭔가 그릴 필요 없음
}
