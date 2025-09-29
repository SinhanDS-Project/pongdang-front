'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
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

  // 모바일 모드 && 가로 모드
  const { isMobile, isLandscape } = useIsMobile()
  const isMobileLandscape = isMobile && isLandscape

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-lg rounded-2xl p-6 shadow-xl max-h-[90dvh]", isMobile ? "w-full h-[90dvh]" : "w-[calc(100%-1rem)]", isMobileLandscape && "overflow-y-auto h-full")}>
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-extrabold tracking-tight">{chatLog.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2.5">
          {/* 질문 */}
          <div className="bg-accent rounded border p-4">
            <div className="mb-2 flex items-center justify-between gap-x-2">
              <MessageCircle className="text-secondary-royal" />
              <span className="text-xl font-bold">질문</span>
              <div className="grow text-end">작성일: {formatDate(chatLog.chat_date)}</div>
            </div>
            <Separator className="mb-4" />
            <article
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{
                __html: chatLog.question || "<p class='text-sm text-gray-500'>내용이 없습니다.</p>",
              }}
            />
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
              <article
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: chatLog.response }}
              />
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle />
                답변이 아직 등록되지 않았습니다.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
