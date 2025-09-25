'use client'

import useSWR, { mutate as globalMutate } from 'swr'

import { api } from '@/lib/net/client-axios'
import { tokenStore } from '@/stores/token-store'

import type { User } from '@/types/auth'

const fetcher = async (url: string) => {
  const res = await api.get<User>(url)
  return res.data
}

export function useMe() {
  const { data, error, isValidating, mutate } = useSWR<User>(
    tokenStore.get() ? '/api/user/me' : null, // 토큰 없으면 요청 안 함
    fetcher,
    {
      revalidateOnFocus: false, // ✅ 포커스 전환 리렌더 방지
      revalidateOnReconnect: true,
      dedupingInterval: 60_000, // 같은 키 60초 내 중복요청 방지
      errorRetryCount: 0, // /me는 실패시 자동 재시도 없음(원하면 조정)
    },
  )

  if (typeof window !== 'undefined') {
    console.log('[useMe] key:', tokenStore.get(), '| data:', !!data, '| error:', !!error)
  }

  return {
    user: data ?? null,
    status: !tokenStore.get() ? 'unauthenticated' : error ? 'unauthenticated' : data ? 'authenticated' : 'loading',
    isValidating,
    mutate,
  } as const
}

/** 토큰이 바뀔 때만 /me를 강제 재검증하고 싶다면 */
export function revalidateMe() {
  return globalMutate('/api/user/me')
}
