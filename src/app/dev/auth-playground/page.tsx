// app/dev/auth-playground/page.tsx
'use client'

import { useState } from 'react'
import { api } from '@/lib/net/client-axios'
import { tokenStore } from '@/stores/token-store'

export default function AuthPlayground() {
  const [log, setLog] = useState<string[]>([])

  const push = (m: string) =>
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()}  ${m}`])

  // 1) (로그인 해둔 상태에서) 엑세스 토큰을 고의로 망가뜨리기
  const poisonAccessToken = () => {
    tokenStore.set('this.is.not.a.valid.jwt') // 가짜 토큰 주입
    push('[TEST] access token을 가짜로 설정했습니다.')
  }

  // 2) 보호 API 호출 (/api/user/me 같은 것) → 401 → refresh → 재시도
  const callProtected = async () => {
    push('[CALL] /api/user/me 호출')
    try {
      const { data } = await api.get('/api/user/me')
      push(`[OK] /api/user/me 성공: user.id=${(data as any)?.id}`)
    } catch (e: any) {
      push(`[FAIL] /api/user/me 실패: ${e?.response?.status} ${e?.message}`)
    }
  }

  // 3) /api/auth/refresh 직접 호출(성공/실패 확인)
  const callRefresh = async () => {
    push('[CALL] /api/auth/refresh 호출')
    try {
      const { data } = await api.post('/api/auth/refresh')
      push(`[OK] refresh 성공: message="${data?.message}"`)
      push(`[OK] 새 access_token 일부=${String(data?.access_token).slice(0, 12)}...`)
    } catch (e: any) {
      push(`[FAIL] refresh 실패: ${e?.response?.status} ${e?.response?.data?.error ?? e?.message}`)
    }
  }

  // 4) 토큰 삭제(로그아웃 비슷)
  const clearToken = () => {
    tokenStore.clear()
    push('[TEST] access token 제거')
  }

  return (
    <div className="container mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Auth Playground</h1>
      <p className="text-sm text-gray-600">
        1) 먼저 정상 로그인으로 HttpOnly refresh 쿠키를 받은 뒤<br/>
        2) "엑세스 토큰 망가뜨리기" → "보호 API 호출" 순으로 눌러서 401→refresh→재시도 과정을 확인하세요.
      </p>

      <div className="flex flex-wrap gap-2">
        <button onClick={poisonAccessToken} className="rounded bg-gray-800 px-4 py-2 text-white">엑세스 토큰 망가뜨리기</button>
        <button onClick={callProtected} className="rounded bg-blue-600 px-4 py-2 text-white">보호 API 호출 (/api/user/me)</button>
        <button onClick={callRefresh} className="rounded bg-emerald-600 px-4 py-2 text-white">/api/auth/refresh 직접 호출</button>
        <button onClick={clearToken} className="rounded bg-red-600 px-4 py-2 text-white">토큰 제거</button>
      </div>

      <div className="rounded border bg-white p-3">
        <div className="mb-2 text-sm font-semibold">로그</div>
        <div className="max-h-72 overflow-auto text-sm leading-6">
          {log.map((l, i) => (<div key={i}>{l}</div>))}
        </div>
      </div>

      <div className="text-xs text-gray-500">
        실제 쿠키가 refresh 요청에 붙는지는 DevTools → Network에서 확인하세요 (Request Headers → Cookie).
      </div>
    </div>
  )
}