// - 매 요청에 access_token 자동 주입
// - 401이면 refresh(백엔드가 내려준 HttpOnly 쿠키 자동 전송) → access 갱신 → "요청" 1회 재시도
// - 동시 401 폭주 시 refresh 1회만 수행하고 나머지는 큐에 대기

import { tokenStore } from '@/lib/auth/token-store' // 메모리+localStorage 저장소 (access만 보관)
import axios, { AxiosError, AxiosRequestConfig } from 'axios'

// ----- 헬퍼: 요청 URL이 /auth/login 또는 /auth/refresh인지 체크 (무한루프/토큰주입 제외용)
function isAuthExempt(url?: string) {
  if (!url) return false
  // axios에 상대경로/절대경로 모두 들어올 수 있음
  const path = url.startsWith('http') ? new URL(url).pathname : url
  return /\/auth\/(login|refresh)/.test(path)
}

// ----- axios 인스턴스
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, // 예: https://api.example.com
  timeout: 10000,
  withCredentials: true, // 중요: refresh HttpOnly 쿠키 전송을 위해 필요
})

const apiPublic = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, // 예: https://api.example.com
  withCredentials: false, // 중요: refresh HttpOnly 쿠키 전송을 위해 필요
})

// ----- 요청 인터셉터: access 토큰 자동 주입
api.interceptors.request.use((config) => {
  // auth 엔드포인트에는 토큰 주입/변조 하지 않음
  if (isAuthExempt(config.url)) return config

  const access = tokenStore.get()
  if (access) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

// ----- 401 동시성 제어를 위한 상태/큐
let isRefreshing = false
let pendingQueue: {
  resolve: (v?: any) => void
  reject: (e: any) => void
  config: AxiosRequestConfig
}[] = []

// ----- refresh 호출 (백엔드는 refresh_token을 HttpOnly 쿠키로 보관 중 → 자동 전송됨)
async function callRefresh(): Promise<string> {
  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
    {}, // 보통 바디 불필요 (쿠키만으로 인증)
    { withCredentials: true },
  )
  const newAccess: string | undefined = res.data?.access_token
  if (!newAccess) throw new Error('No access token from refresh')
  // 새 access 저장(메모리+localStorage) + UX용 쿠키 갱신(선택)
  tokenStore.set(newAccess)
  return newAccess
}

// ----- 응답 인터셉터: 401 → refresh → 원 요청 재시도
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config
    const status = error.response?.status

    // 네트워크 오류이거나 401 외 에러는 그대로 throw
    if (!original || status !== 401) {
      return Promise.reject(error)
    }

    // auth 엔드포인트에서의 401은 그대로 throw (무한 루프 방지)
    if (isAuthExempt(original.url)) {
      return Promise.reject(error)
    }

    // 같은 요청이 이미 재시도 중이라면 다시 재시도하지 않도록 플래그
    if ((original as any)._retry) {
      return Promise.reject(error)
    }
    ;(original as any)._retry = true

    // 이미 다른 요청이 refresh 중이라면, 큐에 넣고 refresh 완료 후 재시도
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject, config: original })
      })
    }

    // 여기서 refresh 수행 (1회)
    isRefreshing = true
    try {
      const newAccess = await callRefresh()

      // 큐에 쌓인 요청들 재시도
      pendingQueue.forEach(({ resolve, config }) => {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${newAccess}`
        resolve(api(config)) // 재요청 시작
      })
      pendingQueue = []

      // 현재 "원 요청" 재시도
      original.headers = original.headers ?? {}
      original.headers.Authorization = `Bearer ${newAccess}`
      return api(original)
    } catch (e) {
      // refresh 실패: 큐 비우고 세션 종료 처리
      pendingQueue.forEach(({ reject }) => reject(e))
      pendingQueue = []
      tokenStore.clear()
      // 필요 시 라우팅
      // if (typeof window !== 'undefined') window.location.replace('/')
      return Promise.reject(e)
    } finally {
      isRefreshing = false
    }
  },
)

export { api, apiPublic }
