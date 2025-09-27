'use client'

import Lottie from 'lottie-react'
import { useMemo, useState } from 'react'

import { useMe } from '@/hooks/use-me'

import { useReportStore } from '@/stores/report-store'

import ReportModal from '@/components/report-page/ReportModal'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { StepGoalForm, StepIncomeForm, StepSavingForm, StepSubmit } from '@components/report-page/report-steps'

import AI_HELPER from '@public/AI_Help.json'

export default function FinanceReportPage() {
  const { user } = useMe()

  const [modalOpen, setModalOpen] = useState(false)

  const report = useReportStore((s) => s.report)
  const step = useReportStore((s) => s.step)
  const reset = useReportStore((s) => s.reset)

  const progress = useMemo(() => (step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100), [step])

  return (
    <div className="mx-auto flex h-full max-w-4xl items-center justify-center p-4">
      <div className="container mx-auto flex grow flex-col gap-y-4 p-4 md:p-6 lg:p-8">
        <div className="flex w-full flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              {/* 좌측: 폼 콘텐츠 */}
              <div className="flex flex-col gap-6 p-6 md:p-8">
                {/* 헤더 */}
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="text-primary-shinhan text-2xl font-extrabold">AI 금융 리포트</div>
                  <p className="text-muted-foreground text-balance">
                    {user?.nickname}님만의 맞춤형 금융 리포트를 생성하세요
                  </p>
                </div>

                {/* 진행률 */}
                <section aria-label="금융 설문 진행률" className="mt-2">
                  <div className="text-muted-foreground mb-2 text-end text-sm">{step}/4</div>
                  <Progress value={progress} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} />
                </section>

                <section
                  className="my-2 grow"
                  role="group"
                  aria-roledescription="signup-steps"
                  aria-label="금융 설문 단계"
                >
                  {step === 1 && <StepIncomeForm />}
                  {step === 2 && <StepSavingForm />}
                  {step === 3 && <StepGoalForm />}
                  {step === 4 && <StepSubmit onOpen={() => setModalOpen(true)} />}
                </section>
              </div>
              {/* 우측: 이미지 */}
              <div className="bg-muted hidden items-center justify-center md:flex">
                <Lottie animationData={AI_HELPER} />
              </div>
            </CardContent>
          </Card>
        </div>
        {/* 결과 모달 */}
        <ReportModal
          open={modalOpen && !!report}
          onClose={() => {
            setModalOpen(false)
            reset()
          }}
          report={report}
        />
      </div>
    </div>
  )
}
