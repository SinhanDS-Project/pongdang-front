'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/net/client-axios'
import BoardTabs from '@/components/board-page/BoardTabs'
import dynamic from 'next/dynamic'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// ReactQuillEditor를 동적 import + SSR 비활성화
const ReactQuillEditor = dynamic(() => import('@/components/board-page/ReactQuill'), {
  ssr: false,
})

// 실제 본문 (body 역할)
function WriteBody() {
  const router = useRouter()
  const sp = useSearchParams()
  const cat = sp.get('cat')?.toUpperCase() || 'FREE'

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  // 모달 상태
  const [successOpen, setSuccessOpen] = useState(false)
  const [errorOpen, setErrorOpen] = useState(false)

  // HTML 태그 제거 후 텍스트만 확인
  const plainText = useMemo(() => content.replace(/<[^>]+>/g, '').trim(), [content])
  const titleEmpty = title.trim().length === 0

  // 최종 onSubmit
  const onSubmit = async () => {
    if (titleEmpty) return setErrorOpen(true)
    if (!plainText) return setErrorOpen(true)

    try {
      await api.post('/api/board', {
        title,
        content,
        category: cat,
      })
      setSuccessOpen(true) //  성공 모달 열기
    } catch (e) {
      setErrorOpen(true) //  실패 모달 열기
    }
  }

  return (
    <main className="mx-auto max-w-6xl">
      <BoardTabs activeCategory="FREE" />
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

      {/* ✅  글 등록 성공 모달 */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>게시글 등록 완료 🎉</DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-gray-600">게시글이 성공적으로 등록되었습니다.</p>
          <DialogFooter>
            <Button
              onClick={() => {
                setSuccessOpen(false)
                router.push('/board/free')
              }}
              className="bg-[var(--color-secondary-royal)] text-white"
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ❌ 글 등록 실패 에러 모달 */}
      <Dialog open={errorOpen} onOpenChange={setErrorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>등록 실패 ⚠️</DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-gray-600">제목과 내용을 확인하거나, 다시 시도해주세요.</p>
          <DialogFooter>
            <Button onClick={() => setErrorOpen(false)} variant="destructive">
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

// 페이지 컴포넌트 (Suspense로 WriteBody 감싸기)
export default function Page() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <WriteBody />
    </Suspense>
  )
}
