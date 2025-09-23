'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/net/client-axios'
import ReactQuillEditor from '@/components/board-page/ReactQuill'

export default function InquiryPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const onSubmit = async () => {
    if (!title.trim()) return alert('제목을 입력해주세요.')
    if (!content.replace(/<[^>]+>/g, '').trim()) return alert('내용을 입력해주세요.')

    try {
      await api.post('/api/chatlog', {
        title,
        question: content,
      })
      alert('마이페이지 문의내역에서 답변을 확인해주세요🌟')
      router.push('/support')
    } catch (e) {
      alert('등록 중 오류가 발생했습니다.')
    }
  }

  return (
    <main className="mx-auto max-w-6xl">
      <section className="relative rounded-2xl border bg-gray-50 p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_220px]">
          {/* 왼쪽: 에디터 영역 */}
          <div className="rounded-2xl border bg-white p-4 sm:p-5">
            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 text-base transition outline-none focus:ring-2 focus:ring-[var(--color-secondary-sky)]"
            />
            <div className="mt-5">
              <ReactQuillEditor value={content} onChange={setContent} height={400} />
              <p className="mt-2 text-xs text-gray-500">최대 2048자까지 쓸 수 있습니다</p>
            </div>
          </div>

          {/* 오른쪽: 버튼 패널 */}
          <div className="flex flex-col items-end justify-end gap-3">
            <button
              type="button"
              onClick={onSubmit}
              disabled={!title.trim() || !content.replace(/<[^>]+>/g, '').trim()}
              className="w-full rounded-full bg-[var(--color-secondary-royal)] px-6 py-3 text-base font-bold text-white transition hover:bg-[var(--color-secondary-navy)] disabled:opacity-60 lg:w-[220px]"
            >
              문의 등록
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
