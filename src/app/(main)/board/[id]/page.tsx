'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/net/client-axios'
import type { Board } from '@/components/board-page/types'
import ReplySection from '@/components/board-page/ReplySection'
import { useMe } from '@/hooks/use-me'

// 댓글 타입
type Reply = {
  id: number
  content: string
  writer: string
  created_at: string
  user_id: number // 작성자 판별용
}

export default function BoardDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { user: currentUser, status } = useMe()

  const [post, setPost] = useState<Board | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liking, setLiking] = useState(false)

  // 댓글 상태
  const [replies, setReplies] = useState<Reply[]>([])
  const [replyError, setReplyError] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)

  // 게시글 가져오기
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const { data } = await api.get(`/api/board/${id}`)
        if (!alive) return
        setPost(data)
      } catch {
        if (!alive) return
        setError('게시글을 불러오지 못했습니다.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  // 댓글 가져오기
  const fetchReplies = async () => {
    try {
      const { data } = await api.get<Reply[]>(`/api/board/${id}/replies`)
      setReplies(data)
    } catch {
      setReplyError('댓글을 불러오지 못했습니다.')
    }
  }

  useEffect(() => {
    if (!id) return
    fetchReplies()
  }, [id])

  // 좋아요
  const handleLike = async () => {
    if (!id || liking) return
    try {
      setLiking(true)
      await api.post(`/api/board/like/${id}`)
      setPost((prev) => (prev ? { ...prev, like_count: (prev.like_count ?? 0) + 1 } : prev))
    } catch {
      alert('좋아요 처리 중 오류가 발생했습니다.')
    } finally {
      setLiking(false)
    }
  }

  // 댓글 작성
  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return alert('댓글 내용을 입력해주세요.')
    if (!currentUser) return alert('로그인 후 댓글을 작성할 수 있습니다.')

    try {
      setReplySubmitting(true)
      const { data } = await api.post<Reply>(`/api/board/${id}/replies`, {
        content: replyContent,
      })
      setReplies((prev) => [...prev, data])
      setReplyContent('')
    } catch {
      alert('댓글 등록 중 오류가 발생했습니다.')
    } finally {
      setReplySubmitting(false)
    }
  }

  // 댓글 수정
  const handleEditReply = async (replyId: number, oldContent: string) => {
    const newContent = prompt('댓글을 수정하세요', oldContent)
    if (!newContent || !newContent.trim()) return

    try {
      await api.put(`/api/board/${id}/replies/${replyId}`, {
        content: newContent,
      })
      setReplies((prev) => prev.map((r) => (r.id === replyId ? { ...r, content: newContent } : r)))
    } catch {
      alert('댓글 수정 중 오류가 발생했습니다.')
    }
  }

  // 댓글 삭제
  const handleDeleteReply = async (replyId: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return

    try {
      await api.delete(`/api/board/${id}/replies/${replyId}`)
      setReplies((prev) => prev.filter((r) => r.id !== replyId))
    } catch {
      alert('댓글 삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading) return <div className="p-6 text-center text-gray-500">불러오는 중…</div>
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>
  if (!post) return <div className="p-6 text-center text-gray-400">게시글이 존재하지 않습니다.</div>

  const isAuthor = currentUser && post.user_id === currentUser.id

  return (
    <main className="mx-auto max-w-6xl">
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
                onClick={handleLike}
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
              onClick={() => router.push('/board')}
              className="w-full rounded-full border border-gray-300 bg-white px-6 py-3 text-base font-bold text-gray-700 transition hover:bg-gray-100 lg:w-[220px]"
            >
              목록으로
            </button>
          </div>
        </div>

        {/* 댓글 영역 */}
        {post.category !== 'NOTICE' && <ReplySection boardId={id} currentUser={currentUser} />}
      </section>
    </main>
  )
}
