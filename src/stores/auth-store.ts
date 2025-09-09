import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { User } from '@/types/auth'

type AuthState = {
  user: User | null
}

type AuthActions = {
  setUser: (user: User | null) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'pd_auth_store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/**
 * 현재 인증된 사용자의 정보를 반환하는 커스텀 훅입니다.
 *
 * @returns 인증된 사용자 정보 객체를 반환합니다.
 */
export const useCurrentUser = () => {
  return useAuthStore((state) => state.user)
}
