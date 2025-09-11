'use client'

import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { tokenStore } from '@/lib/auth/token-store'
import { api } from '@/lib/net/client-axios'
import { useAuthStore } from '@/stores/auth-store'

import type { User } from '@/types/auth'

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'authenticated'; user: User }
  | { status: 'unauthenticated'; user: null }

type AuthContextValue = AuthState & {
  refetch: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null })
  const router = useRouter()
  const mounted = useRef(true)
  const inFlight = useRef<AbortController | null>(null)

  const safeSetState = (next: AuthState) => {
    if (mounted.current) setState(next)
  }

  async function loadMe() {
    inFlight.current?.abort()
    const ac = new AbortController()
    inFlight.current = ac

    try {
      if (!tokenStore.get()) {
        safeSetState({ status: 'unauthenticated', user: null })
        return
      }

      const res = await api.get<User>('/api/user/me', { signal: ac.signal })
      setState({ status: 'authenticated', user: res.data })
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.name === 'AbortError') return

      setState({ status: 'unauthenticated', user: null })
    } finally {
      if (inFlight.current === ac) inFlight.current = null
    }
  }

  useEffect(() => {
    mounted.current = true
    tokenStore.hydrateFromStorage()
    loadMe()

    // 같은 탭 토큰 변경에도 반응
    const unsubToken = tokenStore.subscribe(loadMe)

    // 다른 탭용
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'access_token') loadMe()
    }
    window.addEventListener('storage', onStorage)

    const onFocus = () => loadMe()
    window.addEventListener('focus', onFocus)

    return () => {
      mounted.current = false
      inFlight.current?.abort()
      unsubToken()
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      refetch: loadMe,
      logout: async () => {
        const access = tokenStore.get()

        try {
          // 백엔드 세션/쿠키 무효화
          await api.delete('/api/auth/logout', {
            withCredentials: true,
            headers: access ? { Authorization: `Bearer ${access}` } : undefined,
          })
        } catch (err) {
          console.error('서버 로그아웃 실패 (무시 가능):', err)
        } finally {
          // 프론트 상태 초기화
          tokenStore.clear()
          useAuthStore.getState().clearUser()
          setState({ status: 'unauthenticated', user: null })
          router.replace('/')
        }
      },
    }),
    [state, router],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 내에서만 사용해야 합니다.')
  return ctx
}
