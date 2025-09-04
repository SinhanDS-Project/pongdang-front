// src/lib/server-fetch.ts
import { cookies } from 'next/headers'

const DEFAULT_TOKEN_COOKIE = 'pongdang_token'
const API_BASE = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

type AuthOption = 'auto' | 'none' | { type: 'bearer'; token?: string; cookieName?: string }

type ServerFetchInit = RequestInit & {
  /** ISR 재검증 초 (Next.js) */
  revalidate?: number
  /** Authorization 부착 전략 (기본: "auto") */
  auth?: AuthOption
  /** 베이스 URL 무시하고 절대 URL로 보낼 때 true */
  absolute?: boolean
}

function resolveUrl(pathOrUrl: string, absolute?: boolean) {
  // 절대 URL이면 그대로, 상대면 API_BASE와 합성
  if (absolute) return pathOrUrl
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return (API_BASE ?? '') + pathOrUrl
}

async function buildHeaders(init?: ServerFetchInit) {
  const h = new Headers(init?.headers)
  // JSON 기본 컨텐츠 타입 (필요 시 호출부에서 덮어쓰기)
  if (!h.has('Content-Type')) h.set('Content-Type', 'application/json')

  // Authorization 전략
  const auth = init?.auth ?? 'auto'

  if (auth === 'none') {
    // 명시적 무토큰
    h.delete('Authorization')
    return h
  }

  if (auth === 'auto') {
    // 쿠키에 있으면 자동 부착
    const token = (await cookies()).get(DEFAULT_TOKEN_COOKIE)?.value
    if (token && !h.has('Authorization')) {
      h.set('Authorization', `Bearer ${token}`)
    }
    return h
  }

  // auth가 객체인 경우: 지정 토큰(없으면 쿠키 fallback)
  if (auth && typeof auth === 'object' && auth.type === 'bearer') {
    const cookieName = auth.cookieName ?? DEFAULT_TOKEN_COOKIE
    const token = auth.token ?? (await cookies()).get(cookieName)?.value
    if (token) {
      h.set('Authorization', `Bearer ${token}`)
    } else {
      h.delete('Authorization')
    }
  }

  return h
}

/**
 * 서버 전용 fetch (RSC/Route Handler/Server Action)
 * - Authorization 부착을 요청별로 제어 (auto / none / bearer)
 * - Next ISR(revalidate) 및 cache 옵션 지원
 * - 실패 시 요청 URL 포함한 명확한 에러
 */
export async function serverFetch(pathOrUrl: string, init?: ServerFetchInit): Promise<Response> {
  const url = resolveUrl(pathOrUrl, init?.absolute)
  const headers = await buildHeaders(init)

  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      headers,
      // Next 전용 옵션: ISR/캐시 제어
      next: init?.next ?? (typeof init?.revalidate === 'number' ? { revalidate: init.revalidate } : undefined),
    })
  } catch (e: any) {
    throw new Error(`fetch failed: ${url} :: ${e?.message ?? String(e)}`)
  }

  if (!res.ok) {
    // 응답이 JSON일 수도, 아닐 수도 있으므로 안전하게 파싱 시도
    let msg = `${res.status} ${res.statusText}`
    try {
      const data = await res.clone().json()
      if (data && typeof (data as any).message === 'string') {
        msg = (data as any).message
      }
    } catch {
      // ignore
    }
    const err = new Error(`request failed: ${url} :: ${msg}`)
    // @ts-expect-error 상태코드 부착(로깅 용도)
    err.status = res.status
    throw err
  }

  return res
}

/** JSON 바로 파싱해서 타입 안전하게 반환 */
export async function serverFetchJSON<T>(pathOrUrl: string, init?: ServerFetchInit): Promise<T> {
  const res = await serverFetch(pathOrUrl, init)
  return (await res.json()) as T
}
