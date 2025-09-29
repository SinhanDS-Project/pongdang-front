'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/net/client-axios'
import type { Reply, Board } from '@/types/board'

type Props = {
  boardId: string
  currentUser: Board['user_id'] extends number ? { id: number; nickname: string } | null : null
}

export default function ReplySection({ boardId, currentUser }: Props) {
  const [replies, setReplies] = useState<Reply[]>([])
  const [replyError, setReplyError] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)

  // 수정 모드 상태
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')

  // 댓글 불러오기
  const fetchReplies = async () => {
    try {
      const { data } = await api.get<Reply[]>(`/api/board/${boardId}/replies`)
      setReplies(data)
    } catch {
      setReplyError('댓글을 불러오지 못했습니다.')
    }
  }

  useEffect(() => {
    if (boardId) fetchReplies()
  }, [boardId])

  // 댓글 작성
  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return alert('댓글 내용을 입력해주세요.')
    if (!currentUser) return alert('로그인 후 댓글을 작성할 수 있습니다.')

    try {
      setReplySubmitting(true)
      const { data } = await api.post<Reply>(`/api/board/${boardId}/replies`, {
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

  // 댓글 수정 저장
  const handleSaveEdit = async (replyId: number) => {
    if (!editingContent.trim()) return alert('내용을 입력해주세요.')

    try {
      await api.put(`/api/board/${boardId}/replies/${replyId}`, { content: editingContent })
      setReplies((prev) => prev.map((r) => (r.id === replyId ? { ...r, content: editingContent } : r)))
      setEditingId(null)
      setEditingContent('')
    } catch {
      alert('댓글 수정 중 오류가 발생했습니다.')
    }
  }

  // 댓글 삭제
  const handleDeleteReply = async (replyId: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return
    try {
      await api.delete(`/api/board/${boardId}/replies/${replyId}`)
      setReplies((prev) => prev.filter((r) => r.id !== replyId))
    } catch {
      alert('댓글 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="mt-10 rounded-xl border bg-gray-50 p-4 sm:p-5">
      <h2 className="mb-4 text-lg font-bold">댓글</h2>

      {replyError && <div className="mb-3 text-sm text-red-500">{replyError}</div>}

      {replies.length === 0 ? (
        <div className="text-sm text-gray-500">아직 댓글이 없습니다.</div>
      ) : (
        <ul className="space-y-3">
          {replies.map((r) => {
            const isReplyAuthor = currentUser && currentUser.nickname === r.writer
            const isEditing = editingId === r.id

            return (
              <li key={r.id} className="border-b pb-2 last:border-b-0">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {r.profile_image ? (
                      <img src={r.profile_image} alt={r.writer} className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-gray-300" />
                    )}
                    <span className="font-semibold">{r.writer}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>

                  {isReplyAuthor && (
                    <div className="flex gap-2 text-xs">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveEdit(r.id)} className="text-green-600 hover:underline">
                            저장
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null)
                              setEditingContent('')
                            }}
                            className="text-gray-600 hover:underline"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(r.id)
                              setEditingContent(r.content)
                            }}
                            className="text-blue-600 hover:underline"
                          >
                            수정
                          </button>
                          <button onClick={() => handleDeleteReply(r.id)} className="text-red-600 hover:underline">
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 본문 or 수정 textarea */}
                {isEditing ? (
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="mt-2 w-full rounded-md border p-2 text-sm"
                    rows={3}
                  />
                ) : (
                  <p className="mt-1 text-gray-700">{r.content}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* 댓글 작성 */}
      <div className="mt-6">
        <textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="댓글을 입력하세요"
          className="w-full rounded-md border p-2 text-sm"
          rows={3}
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleReplySubmit}
            disabled={replySubmitting}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            등록하기
          </button>
        </div>
      </div>
    </div>
  )
}
