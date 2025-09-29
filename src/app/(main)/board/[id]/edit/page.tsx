'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/net/client-axios'
import type { Board } from '@/types/board'
import ReactQuillEditor from '@/components/board-page/ReactQuill'
import BoardTabs from '@/components/board-page/BoardTabs'

export default function BoardEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  // text 추출 (태그 제거 후)
  const plainText = useMemo(() => content.replace(/<[^>]+>/g, '').trim(), [content])
  const titleEmpty = title.trim().length === 0

  // 기존 게시글 불러오기
  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await api.get<Board>(`/api/board/${id}`)
        setTitle(data.title)
        setContent(data.content)
      } catch (e) {
        alert('게시글 불러오기 실패')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  // 수정하기
  const onSubmit = async () => {
    if (titleEmpty) return alert('제목을 입력해주세요.')
    if (!plainText) return alert('내용을 입력해주세요.')

    try {
      await api.put(`/api/board/${id}`, { title, content })
      alert('수정되었습니다.')
      router.push(`/board/${id}`)
    } catch (e) {
      alert('수정 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">불러오는 중…</div>
  }

  return (
    <main className="mx-auto max-w-6xl">
      <BoardTabs activeCategory="FREE" />
      <section className="relative rounded-2xl border bg-gray-50 p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_220px]">
          {/* 왼쪽: 에디터 영역 */}
          <div className="rounded-2xl border bg-white p-4 sm:p-5">
            {/* 제목 입력 */}
            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 text-base transition outline-none focus:ring-2 focus:ring-[var(--color-secondary-sky)]"
            />

            {/* 에디터 */}
            <div className="mt-5">
              <ReactQuillEditor value={content} onChange={setContent} height={500} />
              <p className="mt-2 text-xs text-gray-500">최대 2048자까지 쓸 수 있습니다</p>
            </div>
          </div>

          {/* 오른쪽 버튼 패널 */}
          <div className="flex flex-col items-end justify-end gap-3">
            <button
              type="button"
              onClick={onSubmit}
              disabled={titleEmpty || !plainText}
              className="w-full rounded-full bg-[var(--color-secondary-royal)] px-6 py-3 text-base font-bold text-white transition hover:bg-[var(--color-secondary-navy)] disabled:opacity-60 lg:w-[220px]"
            >
              수정하기
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full rounded-full bg-[var(--color-secondary-light)] px-6 py-3 text-base font-bold text-[var(--color-secondary-navy)] transition hover:bg-[var(--color-secondary-sky)] hover:text-white lg:w-[220px]"
            >
              취소하기
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
