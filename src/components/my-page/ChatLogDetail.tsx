'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MessageCircle, Reply, AlertCircle } from 'lucide-react'

type ChatLog = {
  id: number
  title: string
  question: string
  response: string | null
  chat_date: string
  response_date: string | null
  nickname: string
}

type Props = {
  open: boolean
  onClose: () => void
  chatLog: ChatLog | null
}

export default function ChatLogDetailModal({ open, onClose, chatLog }: Props) {
  if (!chatLog) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-secondary-royal text-2xl font-bold">{chatLog.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 질문 */}
          <div className="rounded-lg border bg-gray-50 p-4">
            <div className="mb-2 flex items-center gap-2 font-semibold text-gray-700">
              <MessageCircle className="text-secondary-navy h-5 w-5" />
              질문
            </div>
            <p className="whitespace-pre-line text-gray-800">{chatLog.question}</p>
          </div>

          {/* 답변 */}
          <div className="rounded-lg border bg-gray-50 p-4">
            <div className="mb-2 flex items-center gap-2 font-semibold text-gray-700">
              <Reply className="h-5 w-5 text-green-600" />
              답변
            </div>
            {chatLog.response ? (
              <p className="whitespace-pre-line text-gray-800">{chatLog.response}</p>
            ) : (
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="h-5 w-5" />❗ 답변이 아직 등록되지 않았습니다.
              </div>
            )}
          </div>

          {/* 작성일/답변일 */}
          <div className="flex flex-col gap-1 text-right text-sm text-gray-500">
            <div>작성일: {new Date(chatLog.chat_date).toLocaleString()}</div>
            {chatLog.response_date && <div>답변일: {new Date(chatLog.response_date).toLocaleString()}</div>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
