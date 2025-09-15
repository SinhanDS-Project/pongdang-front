"use client"

import { useState } from "react"
import { Button } from "@components/ui/button"
import { Label } from "@components/ui/label"
import { Textarea } from "@components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card"
import { Badge } from "@components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@components/ui/alert-dialog"
import { api } from "@lib/admin/axios"
import type { Chatlog } from "@/types/admin"
import { toast } from "@/components/ui/use-toast"
import { Send, Trash2, User, Calendar } from "lucide-react"

interface ChatlogAnswerFormProps {
  chatlog: Chatlog
  onAnswerSubmitted: () => void
}

export function ChatlogAnswerForm({ chatlog, onAnswerSubmitted }: ChatlogAnswerFormProps) {
  const [response, setResponse] = useState(chatlog.response || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSubmitAnswer = async () => {
    if (!response.trim()) {
      toast({
        title: "오류",
        description: "답변 내용을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await api.put(`/api/admin/chatlogs/${chatlog.id}/answer`, {
        response: response.trim(),
      })

      toast({
        title: "성공",
        description: "답변이 등록되었습니다.",
      })

      onAnswerSubmitted()
    } catch (error) {
      toast({
        title: "오류",
        description: "답변 등록에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAnswer = async () => {
    setIsDeleting(true)
    try {
      await api.delete(`/api/admin/chatlogs/${chatlog.id}/answer`)

      toast({
        title: "성공",
        description: "답변이 삭제되었습니다.",
      })

      onAnswerSubmitted()
    } catch (error) {
      toast({
        title: "오류",
        description: "답변 삭제에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 문의 정보 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{chatlog.title}</CardTitle>
            <Badge variant={chatlog.response === "ANSWERED" ? "default" : "secondary"}>
              {chatlog.response === "ANSWERED" ? "답변완료" : "미답변"}
            </Badge>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{chatlog.nickname || `사용자 ${chatlog.user_id}`}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(chatlog.chat_date).toLocaleString()}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>문의 내용</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="whitespace-pre-wrap">{chatlog.question}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 답변 작성/수정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{chatlog.response ? "답변 수정" : "답변 작성"}</CardTitle>
          {chatlog.response_date && (
            <p className="text-sm text-muted-foreground">답변일: {new Date(chatlog.response_date).toLocaleString()}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="response">답변 내용</Label>
            <Textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={6}
              placeholder="답변을 입력하세요..."
            />
          </div>

          <div className="flex justify-between">
            <div>
              {chatlog.response && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      답변 삭제
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>답변 삭제</AlertDialogTitle>
                      <AlertDialogDescription>
                        정말로 이 답변을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAnswer}>삭제</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            <Button onClick={handleSubmitAnswer} disabled={isSubmitting}>
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "저장 중..." : chatlog.response ? "답변 수정" : "답변 등록"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
