'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/net/client-axios'
import dynamic from 'next/dynamic'

// ✅ ReactQuillEditor를 동적 import + SSR 비활성화
const ReactQuillEditor = dynamic(() => import('@/components/board-page/ReactQuill'), {
  ssr: false,
})

// 📝 실제 본문 (body 역할)
function WriteBody() {
  const router = useRouter()
  const sp = useSearchParams()
  const cat = sp.get('cat')?.toUpperCase() || 'FREE'

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  // HTML 태그 제거 후 텍스트만 확인
  const plainText = useMemo(() => content.replace(/<[^>]+>/g, '').trim(), [content])
  const titleEmpty = title.trim().length === 0

  // 최종 onSubmit
  const onSubmit = async () => {
    if (titleEmpty) return alert('제목을 입력해주세요.')
    if (!plainText) return alert('내용을 입력해주세요.')

    try {
      await api.post('/api/board', {
        title,
        content,
        category: cat,
      })
      alert('게시글이 등록되었습니다.')
      router.push('/board')
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
              <ReactQuillEditor value={content} onChange={setContent} height={500} />
              <p className="mt-2 text-xs text-gray-500">최대 2048자까지 쓸 수 있습니다</p>
            </div>
          </div>

          {/* 오른쪽: 버튼 패널 */}
          <div className="flex flex-col items-end justify-end gap-3">
            <button
              type="button"
              onClick={onSubmit}
              disabled={titleEmpty || !plainText}
              className="w-full rounded-full bg-[var(--color-secondary-royal)] px-6 py-3 text-base font-bold text-white transition hover:bg-[var(--color-secondary-navy)] disabled:opacity-60 lg:w-[220px]"
            >
              등록하기
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

// 📄 페이지 컴포넌트 (Suspense로 WriteBody 감싸기)
export default function Page() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <WriteBody />
    </Suspense>
  )
}
