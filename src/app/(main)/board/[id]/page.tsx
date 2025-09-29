'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/net/client-axios'
import type { Board, Reply } from '@/types/board'
import ReplySection from '@/components/board-page/ReplySection'
import { useMe } from '@/hooks/use-me'
import BoardTabs from '@/components/board-page/BoardTabs'

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

export default function BoardDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useMe()

  const [post, setPost] = useState<Board | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liking, setLiking] = useState(false)

  const [replies, setReplies] = useState<Reply[]>([])
  const [replyError, setReplyError] = useState<string | null>(null)

  // 로그인 모달 상태
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  // 게시글 불러오기
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)

        //  먼저 공지사항 API 시도 (로그인 필요 없음)
        try {
          const { data: noticeData } = await api.get(`/api/support/detail/${id}`)
          if (!alive) return

          if (noticeData?.category === 'NOTICE') {
            setPost(noticeData)
            return
          }
          // 만약 공지사항이 아닌데도 성공 응답 내려왔다면 → 무시하고 일반 board API로 진행
        } catch {
          // 실패 시 그냥 board API로
        }

        // 2️⃣ 일반 게시글 API 호출
        try {
          const { data } = await api.get(`/api/board/${id}`)
          if (!alive) return
          setPost(data) // 200이면 로그인 된 상태
        } catch (err: any) {
          if (!alive) return
          //  401 Unauthorized면 로그인 모달
          if (err.response?.status === 401) {
            setLoginModalOpen(true)
            return
          }
          // 그 외 에러
          setError('게시글을 불러오지 못했습니다.')
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [id])

  // 댓글 불러오기 (공지사항 제외)
  useEffect(() => {
    if (!id || !post || post.category === 'NOTICE') return
    ;(async () => {
      try {
        const { data } = await api.get<Reply[]>(`/api/board/${id}/replies`)
        setReplies(data)
      } catch {
        setReplyError('댓글을 불러오지 못했습니다.')
      }
    })()
  }, [id, post])

  if (loading) return <div className="p-6 text-center text-gray-500">불러오는 중…</div>
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>
  if (!post && !loginModalOpen) return <div className="p-6 text-center text-gray-400">게시글 목록으로 이동중 ...</div>

  const isAuthor = currentUser && post?.user_id === currentUser.id

  return (
    <main className="mx-auto max-w-6xl">
      <BoardTabs activeCategory={post?.category} />

      {post && (
        <section className="relative rounded-2xl border bg-gray-50 p-4 shadow-sm sm:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_220px]">
            {/* 본문 */}
            <div className="min-h-[600px] rounded-2xl border bg-white p-4 sm:p-5">
              <h1 className="mb-4 text-2xl font-bold">{post.title}</h1>

              {/* 작성자 / 조회수 / 좋아요 / 작성일 */}
              <div className="mb-3 grid grid-cols-4 text-center text-sm text-gray-500">
                <span>{post.nickname}</span>
                <span>조회수 {post.view_count ?? 0}</span>
                <button
                  onClick={async () => {
                    if (!id || liking) return
                    try {
                      setLiking(true)
                      await api.post(`/api/board/like/${id}`)
                      setPost((prev) => (prev ? { ...prev, like_count: (prev.like_count ?? 0) + 1 } : prev))
                    } finally {
                      setLiking(false)
                    }
                  }}
                  disabled={liking}
                  className="flex items-center justify-center gap-1 text-pink-600 hover:text-pink-700 disabled:opacity-50"
                >
                  ❤️ 좋아요 {post.like_count ?? 0}
                </button>
                <span>{new Date(post.created_at).toISOString().slice(0, 10)}</span>
              </div>

              <div className="mb-6 border-t border-gray-200" />

              {/* 본문 내용 */}
              <article className="prose mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>

            {/* 오른쪽 버튼 */}
            <div className="flex flex-col items-end justify-end gap-3">
              {isAuthor && post.category !== 'NOTICE' && (
                <>
                  <button
                    onClick={() => router.push(`/board/${id}/edit`)}
                    className="w-full rounded-full bg-[var(--color-secondary-royal)] px-6 py-3 text-base font-bold text-white transition hover:bg-[var(--color-secondary-navy)] lg:w-[220px]"
                  >
                    수정하기
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('정말 삭제하시겠습니까?')) {
                        try {
                          await api.delete(`/api/board/${id}`)
                          alert('삭제되었습니다.')
                          router.push('/board')
                        } catch {
                          alert('삭제 중 오류가 발생했습니다.')
                        }
                      }
                    }}
                    className="w-full rounded-full bg-[var(--color-secondary-light)] px-6 py-3 text-base font-bold text-[var(--color-secondary-navy)] transition hover:bg-[var(--color-secondary-sky)] hover:text-white lg:w-[220px]"
                  >
                    삭제하기
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  if (post?.category === 'NOTICE') {
                    router.push('/board/notice')
                  } else {
                    router.push('/board/free')
                  }
                }}
                className="w-full rounded-full border border-gray-300 bg-white px-6 py-3 text-base font-bold text-gray-700 transition hover:bg-gray-100 lg:w-[220px]"
              >
                목록으로
              </button>
            </div>
          </div>

          {/* 댓글 영역 */}
          {post.category !== 'NOTICE' && <ReplySection boardId={id} currentUser={currentUser} />}
        </section>
      )}

      {/* 로그인 모달 */}
      <AlertDialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그인이 필요합니다</AlertDialogTitle>
            <AlertDialogDescription>이 게시글을 보려면 로그인이 필요합니다. 로그인하시겠습니까?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => router.push('/board')}>취소하기</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push('/signin')}
              className="bg-secondary-royal hover:bg-secondary-navy"
            >
              로그인하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
