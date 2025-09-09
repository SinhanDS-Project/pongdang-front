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

export type RegisterRequest = {
  email: string
  password: string
  password_check: string
  user_name: string
  nickname: string
  birth_date: string // YYYY-MM-DD
  phone_number: string // 백엔드 요구 형식(하이픈 포함이면 그대로, 없으면 제거해서 보내도 OK)
  agree_privacy: boolean
  linked_with_betting: boolean
}

export type RegisterResponse = {
  // 백엔드 응답 스키마에 맞게 확장
  id: number
  email: string
  nickname: string
}

export async function register(payload: RegisterRequest) {
  const res = await api.post<RegisterResponse>('/api/auth/register', payload)
  return res.data
}

export type BettingUser = {
  uid: string
  user_name: string
  nickname: string
  email: string
  phone_number: string
  birth_date: string
  agree_privacy: boolean
}

export async function findBettingUser(payload: { name: string; phone: string }) {
  // phone은 API 예시대로 하이픈 포함값을 사용 (010-xxxx-xxxx)
  const res = await api.post<BettingUser>('/api/auth/find-betting-user', payload)
  return res.data
}

/** 닉네임 중복 검사: 사용 가능하면 true, 아니면 false 반환 */
export async function checkNicknameDup(nickname: string): Promise<boolean> {
  try {
    const res = await api.get(`/api/auth/check-nickname?nickname=${nickname}`)

    if (typeof res.data?.duplicate === 'boolean') {
      return !res.data.duplicate // 중복 여부를 반대로 반환 (중복이면 false, 사용 가능하면 true)
    }

    throw new Error('응답 데이터가 올바르지 않습니다.')
  } catch (error) {
    throw new Error('닉네임 중복 검사 중 오류가 발생했습니다.')
  }
}

/** 이메일 인증번호 발송 */
export async function requestEmailCode(email: string) {
  const { data } = await api.post(
    '/api/email/request',
    { email },
    {
      headers: { 'Content-Type': 'application/json' },
    },
  )
  return data
}

/** 이메일 인증번호 검증 */
export async function verifyEmailCode(email: string, code: string) {
  const { data } = await api.post(
    '/api/email/verify',
    { email, code },
    {
      headers: { 'Content-Type': 'application/json' },
    },
  )
  return data
}

/** 인증번호 발송 */
export async function sendPhoneCode(phone: string) {
  const { data } = await api.post(
    '/api/auth/phone/send',
    { phone }, // 서버 예시가 하이픈 포함이라 그대로 보냄
    { headers: { 'Content-Type': 'application/json' } },
  )
  return data
}

/** 인증번호 검증 */
export async function verifyPhoneCode(phone: string, code: string) {
  const { data } = await api.post(
    '/api/auth/phone/verify',
    { phone, code },
    { headers: { 'Content-Type': 'application/json' } },
  )
  return data
}
