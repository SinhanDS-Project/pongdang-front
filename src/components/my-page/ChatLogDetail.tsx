'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, MessageCircle, Reply } from 'lucide-react'

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

function formatDate(date: string | Date) {
  const parsedDate = typeof date === 'string' ? new Date(date) : date
  return parsedDate.toISOString().split('T')[0] // "2025-09-03"
}

export default function ChatLogDetailModal({ open, onClose, chatLog }: Props) {
  if (!chatLog) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl p-6 shadow-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-extrabold tracking-tight">{chatLog.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2.5">
          <div className="bg-accent rounded border p-4">
            <div className="mb-2 flex items-center justify-between gap-x-2">
              <MessageCircle className="text-secondary-royal" />
              <span className="text-xl font-bold">질문</span>
              <div className="grow text-end">작성일: {formatDate(chatLog.chat_date)}</div>
            </div>
            <Separator className="mb-4" />
            <p className="whitespace-pre-line">{chatLog.question}</p>
          </div>
          <Separator />
          {/* 답변 */}
          <div className="bg-accent rounded border p-4">
            <div className="mb-2 flex items-center justify-between gap-x-2">
              <Reply className="text-green-600" />
              <span className="text-xl font-bold">답변</span>
              {chatLog.response_date && (
                <div className="grow text-end">답변일: {formatDate(chatLog.response_date)}</div>
              )}
            </div>
            <Separator className="mb-4" />
            {chatLog.response ? (
              <p className="whitespace-pre-line">{chatLog.response}</p>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="text-red-500" />
                답변이 아직 등록되지 않았습니다.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
