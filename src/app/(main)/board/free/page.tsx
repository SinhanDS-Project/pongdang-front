'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/net/client-axios'
import type { Board } from '@/components/board-page/types'
import { FreeTable } from '@/components/board-page/FreeTable'
import { PongPagination } from '@/components/PongPagination'
import axios, { type AxiosError } from 'axios'

// 글쓰기 버튼
function WriteButton() {
  return (
    <Link
      href="/board/write"
      aria-label="글쓰기"
      className={[
        'rounded-full px-5 py-2.5 font-medium shadow-sm transition',
        'border-[var(--color-secondary-royal)] bg-[var(--color-secondary-royal)] text-white',
        'hover:border-[var(--color-secondary-navy)] hover:bg-[var(--color-secondary-navy)]',
        'focus:ring-2 focus:ring-[var(--color-secondary-royal)] focus:ring-offset-2 focus:outline-none',
      ].join(' ')}
    >
      글쓰기
    </Link>
  )
}

type PageResp = {
  boards: {
    content: Board[]
    total_pages: number
    number: number
  }
}

// 에러 메시지 추출
function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ message?: string }>
    return ax.response?.data?.message ?? ax.message
  }
  if (err instanceof Error) return err.message
  return '알 수 없는 오류가 발생했습니다.'
}

export default function FreePage() {
  const pageSize = 10
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Board[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 정렬 기준 상태
  const [sort, setSort] = useState<'createdAt' | 'viewCount' | 'likeCount'>('createdAt')

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get<PageResp>('/api/board', {
          params: { page, category: 'FREE', sort, size: pageSize },
        })
        if (!alive) return

        setItems(data.boards?.content ?? [])
        setTotalPages(Math.max(1, data.boards?.total_pages ?? 1))
      } catch (err: unknown) {
        if (!alive) return
        setError(getErrorMessage(err))
        setItems([])
        setTotalPages(1)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [page, sort])

  return (
    <>
      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* 정렬 버튼 + 글쓰기 버튼 */}
      <div className="mb-3 flex items-center justify-between">
        {/* 정렬 버튼들 - 살짝 오른쪽으로 */}
        <div className="ml-4 flex gap-2">
          <button
            onClick={() => setSort('createdAt')}
            className={[
              'rounded px-3 py-1 text-sm font-medium',
              sort === 'createdAt'
                ? 'bg-[var(--color-secondary-royal)] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            최신순
          </button>
          <button
            onClick={() => setSort('viewCount')}
            className={[
              'rounded px-3 py-1 text-sm font-medium',
              sort === 'viewCount'
                ? 'bg-[var(--color-secondary-royal)] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            조회순
          </button>
          <button
            onClick={() => setSort('likeCount')}
            className={[
              'rounded px-3 py-1 text-sm font-medium',
              sort === 'likeCount'
                ? 'bg-[var(--color-secondary-royal)] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            좋아요순
          </button>
        </div>

        {/* 글쓰기 버튼  */}
        <div className="mr-8">
          <WriteButton />
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-500">불러오는 중…</div>
      ) : (
        <FreeTable items={items} page={page} pageSize={pageSize} basePath="/board" title={undefined} />
      )}

      <div className="mt-4 flex items-center justify-between">
        <div />
        <div className="flex flex-1 justify-center">
          <PongPagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>
    </>
  )
}
