import { tokenStore } from '@/lib/auth/token-store'
import api from '@/lib/net/client-axios'

import { useAuthStore } from '@/stores/auth-store'

import type { User } from '@/types/auth'

type LoginPayload = { email: string; password: string }
type LoginResponse = { access_token: string; message: string; user: User }

export async function login(payload: LoginPayload) {
  try {
    const res = await api.post<LoginResponse>('/api/auth/login', payload, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    })

    const access = res.data?.access_token
    const user = res.data?.user

    if (!access || !user) throw new Error('로그인 정보가 올바르지 않습니다.')

    tokenStore.set(access)
    useAuthStore.getState().setUser(user)

    return res.data
  } catch (error: any) {
    const status = error?.response?.status
    const msg = error?.response?.data?.message
    if (status === 401) {
      // 자격 증명 오류
      throw new Error(msg ?? '아이디 또는 비밀번호가 올바르지 않습니다.')
    } else {
      throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    }
  }
}
