// src/lib/net/client-axios.ts
// - 매 요청에 access_token 자동 주입
// - 401이면 refresh(쿠키) → access 갱신 → "요청" 1회 재시도
// - 동시 401 폭주 시 refresh 1회만 수행하고 나머지는 대기(구독/발행 패턴)

import { tokenStore } from '@/stores/token-store'
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// ----- 유틸: 인증 예외 경로(토큰 주입/리프레시 재귀 방지)
function isAuthExempt(url?: string) {
  if (!url) return false
  const path = url.startsWith('http') ? new URL(url).pathname : url
  return /\/auth\/(login|refresh|logout)/.test(path)
}

// ----- 인스턴스
export const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // refresh에 HttpOnly 쿠키 필요
})

export const apiPublic: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  withCredentials: false,
})

// ---------------------------------------------------------------------------
// 리프레시 토큰 동시성 제어 (구독/발행 방식)
// ---------------------------------------------------------------------------
let refreshPromise: Promise<string | null> | null = null
let subscribers: Array<(token: string | null) => void> = []

function subscribeRefresh(cb: (token: string | null) => void) {
  subscribers.push(cb)
}
function publishRefreshDone(token: string | null) {
  subscribers.forEach((cb) => {
    try {
      cb(token)
    } catch {}
  })
  subscribers = []
}

async function doRefresh(): Promise<string | null> {
  try {
    const res = await axios.post<{ access_token: string }>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/refresh`)
    const access = res.data?.access_token
    if (access) {
      tokenStore.set(access) // 메모리+로컬스토리지 갱신
      return access
    }
  } catch {
    // ignore
  }
  tokenStore.clear()
  return null
}

// ---------------------------------------------------------------------------
// 인터셉터 장착 함수(재사용 가능)
// ---------------------------------------------------------------------------
function attachInterceptors(instance: AxiosInstance) {
  // 요청: 액세스 토큰 주입
  instance.interceptors.request.use((config) => {
    if (isAuthExempt(config.url)) return config
    const access = tokenStore.get()
    if (access) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${access}`
    }
    return config
  })

  // 응답: 401 → refresh → 1회 재시도
  instance.interceptors.response.use(
    (res: AxiosResponse) => res,
    async (error: AxiosError) => {
      const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined
      const status = error.response?.status

      // 원본 설정이 없거나, 401이 아니면 그대로 전달
      if (!original || status !== 401) return Promise.reject(error)
      // 인증 예외 경로에서의 401은 그대로
      if (isAuthExempt(original.url)) return Promise.reject(error)
      // ⬇️ 액세스 토큰이 전혀 없으면 리프레시 시도하지 않음
      if (!tokenStore.get()) return Promise.reject(error)
      // 이미 재시도한 요청이면 중복 방지
      if (original._retry) return Promise.reject(error)
      original._retry = true

      // 이미 다른 곳에서 refresh 진행 중이면 구독 후 재시도
      if (refreshPromise) {
        const token = await new Promise<string | null>((resolve) => subscribeRefresh(resolve))
        if (!token) return Promise.reject(error) // refresh 실패
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${token}`
        return instance(original)
      }

      // 새 refresh 시작(전역 1회)
      refreshPromise = doRefresh()
      const newToken = await refreshPromise.finally(() => {
        // publish 전에 반드시 null로 리셋
        const t = refreshPromise
        refreshPromise = null
        return t
      })

      // 구독자 깨우기
      publishRefreshDone(newToken)

      if (!newToken) {
        // 실패 → 세션 종료(선택) 후 에러 전파
        return Promise.reject(error)
      }

      // 현재 원 요청 재시도
      original.headers = original.headers ?? {}
      original.headers.Authorization = `Bearer ${newToken}`
      return instance(original)
    },
  )
}

attachInterceptors(api)
