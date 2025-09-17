"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QuizModalProps {
  quiz: {
    question: string
    options: string[]
    correct: number
  }
  onAnswer: (answerIndex: number) => void
}

export function QuizModal({ quiz, onAnswer }: QuizModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-center">🧠 퀴즈 시간!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center font-medium text-lg mb-6">{quiz.question}</div>

          <div className="space-y-2">
            {quiz.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full text-left justify-start h-auto p-4 bg-transparent"
                onClick={() => onAnswer(index)}
              >
                <span className="font-medium mr-2">{index + 1}.</span>
                {option}
              </Button>
            ))}
          </div>

          <div className="text-center text-sm text-muted-foreground mt-4">정답: +5골드 | 오답: -5골드</div>
        </CardContent>
      </Card>
    </div>
  )
}
