// src/stores/auth-store.ts

import { tokenStore } from '@/lib/auth/token-store'
import { api, apiPublic } from '@/lib/net/client-axios'
import type { User } from '@/types/auth'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthState = {
  status: AuthStatus
  user: User | null
}

type AuthActions = {
  /** /api/user/me 다시 불러와서 상태 갱신 */
  loadMe: () => Promise<void>
  /** 로그아웃 (서버 세션/쿠키 무효화 + 프론트 정리) */
  logout: () => Promise<void>
  /** 내부용: 사용자 수동 설정 */
  setUser: (user: User | null) => void
  /** 내부용: status 수동 설정 */
  setStatus: (s: AuthStatus) => void
}

async function tryRefresh(): Promise<string | null> {
  try {
    // HttpOnly 쿠키 사용 → withCredentials: true 필수
    const res = await apiPublic.post<{ access_token: string }>('/api/auth/refresh', null, {
      withCredentials: true,
    })
    const access = res.data?.access_token
    if (access) {
      tokenStore.set(access)
      return access
    }
  } catch (e) {
    // refresh 실패 → 토큰 제거
  }
  tokenStore.clear()
  return null
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      status: 'loading',
      user: null,

      setUser: (user) => set({ user, status: user ? 'authenticated' : 'unauthenticated' }),
      setStatus: (s) => set({ status: s }),

      loadMe: async () => {
        // 1) access 토큰이 없으면 우선 refresh 시도
        let access = tokenStore.get()
        if (!access) {
          set({ status: 'unauthenticated', user: null })
          return
        }

        // 2) /me 요청 시도
        try {
          set({ status: 'loading' })
          const res = await api.get<User>('/api/user/me')
          set({ status: 'authenticated', user: res.data })
        } catch (err: any) {
          // 3) 401이면 한 번 더 refresh → /me 재시도
          if (err?.response?.status === 401) {
            const refreshed = await tryRefresh()
            if (refreshed) {
              try {
                const res2 = await api.get<User>('/api/user/me')
                set({ status: 'authenticated', user: res2.data })
                return
              } catch {}
            }
          }
          // 최종 실패
          tokenStore.clear()
          set({ status: 'unauthenticated', user: null })
        }
      },

      logout: async () => {
        const access = tokenStore.get()
        try {
          await api.delete('/api/auth/logout', {
            withCredentials: true,
            headers: access ? { Authorization: `Bearer ${access}` } : undefined,
          })
        } catch (e) {
          console.warn('서버 로그아웃 실패(무시 가능):', e)
        } finally {
          tokenStore.clear()
          set({ status: 'unauthenticated', user: null })
        }
      },
    }),
    {
      name: 'pd_auth_store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/** 셀렉터: 현재 유저 */
export const useCurrentUser = () => useAuthStore((s) => s.user)
/** 셀렉터: 상태 */
export const useAuthStatus = () => useAuthStore((s) => s.status)
