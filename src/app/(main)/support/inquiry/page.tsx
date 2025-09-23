'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/net/client-axios'
import dynamic from 'next/dynamic'
import { useMe } from '@/hooks/use-me'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// ✅ ReactQuillEditor를 동적 import + SSR 비활성화
const ReactQuillEditor = dynamic(() => import('@/components/board-page/ReactQuill'), {
  ssr: false,
})

export default function InquiryPage() {
  const { user } = useMe()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  // 로그인 안내 모달 상태
  const [loginNoticeOpen, setLoginNoticeOpen] = useState(false)

  // 등록 완료 모달 상태
  const [submitNoticeOpen, setSubmitNoticeOpen] = useState(false)

  const onSubmit = async () => {
    if (!title.trim()) return alert('제목을 입력해주세요.')
    if (!content.replace(/<[^>]+>/g, '').trim()) return alert('내용을 입력해주세요.')

    try {
      await api.post('/api/chatlog', {
        title,
        question: content,
      })
      setSubmitNoticeOpen(true)
    } catch (e) {
      alert('등록 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    if (!user) setLoginNoticeOpen(true)
  }, [user])

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

      {/* 로그인 안내 모달 */}
      <AlertDialog open={loginNoticeOpen} onOpenChange={setLoginNoticeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그인이 필요합니다</AlertDialogTitle>
            <AlertDialogDescription>해당 메뉴는 로그인 후 이용할 수 있습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <AlertDialogCancel onClick={() => router.push('/support/faq')}>FAQ로 가기</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push('/signin')}
              className="bg-secondary-royal hover:bg-secondary-navy"
            >
              로그인하러 가기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 등록 완료 모달 */}
      <AlertDialog open={submitNoticeOpen} onOpenChange={setSubmitNoticeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>문의가 등록되었습니다</AlertDialogTitle>
            <AlertDialogDescription>
              마이페이지의 <strong>문의내역</strong>에서 답변을 확인하실 수 있습니다 🌟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => router.push('/support')}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
