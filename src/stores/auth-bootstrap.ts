'use client'
import { useEffect } from 'react'
import { revalidateMe } from '@/hooks/use-me'
import { tokenStore } from './token-store'
import { api } from '@/lib/net/client-axios'

async function ensureDailyQuiz() {
  try {
    const { data } = await api.post<boolean>('/api/quiz')
    if (data === true) return
    await api.post('/api/quiz', {})
  } catch (err) {
    console.error('퀴즈 확인/생성 중 오류:', err)
  }
}

export function EnsureDailyQuiz() {
  useEffect(() => {
    ensureDailyQuiz()
  }, [])
  return null
}

export function AuthBootstrapClient() {
  useEffect(() => {
    tokenStore.hydrateFromStorage()

    const unsub = tokenStore.subscribe(() => {
      revalidateMe()
    })

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'access_token') revalidateMe()
    }
    window.addEventListener('storage', onStorage)

    return () => {
      unsub()
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return null
}
