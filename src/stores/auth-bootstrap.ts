'use client'

import { tokenStore } from '@/lib/auth/token-store'
import { api } from '@/lib/net/client-axios'
import { useAuthStore } from '@/stores/auth-store'
import { useEffect, useRef } from 'react'

async function ensureDailyQuiz() {
  try {
    // 존재 여부 확인
    const { data } = await api.post<boolean>('/api/quiz')

    if (data === true) {
      return
    }

    // false → 직접 생성 요청
    const res = await api.post('/api/quiz', {})
    console.log('오늘 퀴즈 새로 생성됨 ✨', res.data)
  } catch (err) {
    console.error('퀴즈 확인/생성 중 오류:', err)
  }
}

export function useAuthBootstrap() {
  const loadMe = useAuthStore((s) => s.loadMe)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true

    // 토큰 초기화(로컬스토리지 → 메모리)
    tokenStore.hydrateFromStorage()

    // 최초 로드
    loadMe().then(() => ensureDailyQuiz())

    // 같은 탭에서 토큰 바뀌면 재로딩
    const unsubToken = tokenStore.subscribe(async () => {
      await loadMe()
      await ensureDailyQuiz()
    })

    // 다른 탭에서 토큰 바뀌면 재로딩
    const onStorage = async (e: StorageEvent) => {
      if (e.key === 'access_token') {
        await loadMe()
        await ensureDailyQuiz()
      }
    }
    window.addEventListener('storage', onStorage)

    // 탭 포커스 시 재검증
    const onFocus = async () => {
      await loadMe()
      await ensureDailyQuiz()
    }
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
