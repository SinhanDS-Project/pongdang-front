'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/net/client-axios'
import type { Board } from '@/components/board-page/types'
import { BoardTable } from '@/components/board-page/BoardTable'
import { PongPagination } from '@/components/PongPagination'
import axios, { type AxiosError } from 'axios'
import { useRouter } from 'next/navigation'
import BoardTabs from '@/components/board-page/BoardTabs'

// API 응답 타입
type PageResp = {
  boards: {
    content: Board[]
    total_pages: number
    number: number
  }
}

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

  //  정렬 상태
  const [sort, setSort] = useState<'createdAt' | 'viewCount' | 'likeCount'>('createdAt')

  const router = useRouter()

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get<PageResp>('/api/board', {
          params: { page, category: 'FREE', sort, size: pageSize }, //  sort 포함
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
      <BoardTabs activeCategory="FREE" />
      {loading ? (
        <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-500">불러오는 중…</div>
      ) : (
        <BoardTable
          items={items}
          page={page}
          pageSize={pageSize}
          variant="FREE"
          basePath="/board/free"
          onSortChange={setSort}
          onWriteClick={() => router.push('/board/write')}
        />
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
