'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Lottie from 'lottie-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import { api } from '@/lib/net/client-axios'
import { ReportPayload, type Step3, step3Schema } from '@/lib/report/report-schemas'

import { useReportStore } from '@/stores/report-store'

import { FinanceReport } from '@/types/report'

import { useMe } from '@/hooks/use-me'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

import AI_LOADING from '@public/AI_Loading.json'

const onlyDigits = (v: string) => v.replace(/\D/g, '')

export function formatMoney(v: string) {
  const d = onlyDigits(v)
  if (!d) return ''
  // 정수형으로 변환 후 localeString
  return Number(d).toLocaleString('ko-KR')
}

export function StepGoalForm() {
  const { user } = useMe()
  const setStep = useReportStore((s) => s.setStep)
  const setReport = useReportStore((s) => s.setReport)

  const incomeSnap = useReportStore((s) => s.income ?? 0)
  const spendSnap = useReportStore((s) => s.spend ?? 0)
  const mainCategorySnap = useReportStore((s) => s.main_category ?? undefined)
  const currentSavingSnap = useReportStore((s) => s.current_saving ?? 0)
  const loanSnap = useReportStore((s) => s.loan ?? undefined)

  const savingGoalSnap = useReportStore((s) => s.saving_goal ?? 0)
  const investTypeSnap = useReportStore((s) => s.invest_type ?? undefined)
  const goalTermSnap = useReportStore((s) => s.goal_term ?? undefined)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const defaultValues = useMemo<Step3>(
    () => ({
      saving_goal: savingGoalSnap,
      invest_type: investTypeSnap,
      goal_term: goalTermSnap,
    }),
    [savingGoalSnap, investTypeSnap, goalTermSnap],
  )

  const form = useForm<Step3>({
    resolver: zodResolver(step3Schema),
    defaultValues,
    mode: 'onChange',
  })

  // 현재 폼의 "실시간 값"을 감시
  const saving_goal = form.watch('saving_goal')
  const invest_type = form.watch('invest_type')
  const goal_term = form.watch('goal_term')

  // 안전한 나이 계산 (빈 값 방어)
  const age = useMemo(() => {
    const b = user?.birth_date
    if (!b || !/^\d{4}-\d{2}-\d{2}$/.test(b)) return undefined
    const today = new Date()
    const [y, m, d] = b.split('-').map(Number)
    const birth = new Date(y, m - 1, d)
    let a = today.getFullYear() - birth.getFullYear()
    const hadBirthday =
      today.getMonth() > birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate())
    if (!hadBirthday) a--
    return a
  }, [user?.birth_date])

  // ✅ canGenerate는 "이전 스텝은 스토어", "현재 스텝은 form.watch" 기준으로
  const canGenerate = useMemo(() => {
    const step1Ok = incomeSnap > 0 && spendSnap > 0 && !!mainCategorySnap
    const step2Ok = typeof currentSavingSnap === 'number' && !!loanSnap
    const step3Ok = (saving_goal ?? 0) > 0 && !!invest_type && !!goal_term
    return step1Ok && step2Ok && step3Ok
  }, [incomeSnap, spendSnap, mainCategorySnap, currentSavingSnap, loanSnap, saving_goal, invest_type, goal_term])

  async function onSubmit(values: Step3) {
    setErrorMsg(null)

    // ✅ 현재 스텝 폼 유효성부터 보장
    const ok = await form.trigger()
    if (!ok) return

    // ✅ 전체 입력 검증 (이전 스텝 값 포함)
    if (!canGenerate) {
      setErrorMsg('입력값을 다시 확인해주세요.')
      return
    }

    const payload: ReportPayload & { age?: number } = {
      // 이전 스텝 (스토어)
      income: incomeSnap,
      spend: spendSnap,
      main_category: mainCategorySnap!, // 위에서 !!로 확인함
      current_saving: currentSavingSnap,
      loan: loanSnap,

      // 현재 스텝 (폼 값)
      saving_goal: values.saving_goal,
      invest_type: values.invest_type!,
      goal_term: values.goal_term!,

      // 선택: 서버가 원하면 전송
      age,
    }

    try {
      setLoading(true) //  로딩 시작
      const { data } = await api.post<FinanceReport>('/api/finance/report', payload)
      setReport(data)
      setStep(4)
    } catch {
      alert('리포트 생성 실패')
    } finally {
      setLoading(false) //  로딩 끝
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-y-8">
        <Lottie animationData={AI_LOADING} className="w-52" />
        <div className="text-base font-bold">AI가 분석중입니다...</div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {/* 목표 저축액 */}
        <FormField
          control={form.control}
          name="saving_goal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>총 목표 저축액은 얼마인가요? (단위: 만원)</FormLabel>
              <FormControl>
                <Input
                  placeholder="예: 1,000,000"
                  value={formatMoney(field.value?.toString() ?? '')}
                  onChange={(e) => {
                    const raw = onlyDigits(e.target.value)
                    // react-hook-form에는 숫자 값 저장
                    field.onChange(raw ? parseInt(raw, 10) : 0)
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 투자 성향 */}
        <FormField
          control={form.control}
          name="invest_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>투자 성향이 가장 가까운 것은 무엇인가요?</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value ?? ''} className="flex gap-4">
                  <FormItem className="flex items-center gap-2">
                    <RadioGroupItem value="안정형" id="invest-stable" />
                    <FormLabel htmlFor="invest-stable">안정형</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center gap-2">
                    <RadioGroupItem value="중립형" id="invest-neutral" />
                    <FormLabel htmlFor="invest-neutral">중립형</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center gap-2">
                    <RadioGroupItem value="공격형" id="invest-aggressive" />
                    <FormLabel htmlFor="invest-aggressive">공격형</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 달성하는 기간 */}
        <FormField
          control={form.control}
          name="goal_term" // '단기' | '중기' | '장기'
          render={({ field }) => (
            <FormItem>
              <FormLabel>목표 저축액을 달성하는 기간은 어느 정도인가요?</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange} // 문자열 그대로 저장
                  value={field.value ?? ''} // RHF 제어값
                  className="flex gap-4"
                >
                  <FormItem className="flex items-center gap-2">
                    <RadioGroupItem value="단기" id="goal-term-short" />
                    <FormLabel htmlFor="goal-term-short" className="font-normal">
                      단기
                    </FormLabel>
                  </FormItem>

                  <FormItem className="flex items-center gap-2">
                    <RadioGroupItem value="중기" id="goal-term-mid" />
                    <FormLabel htmlFor="goal-term-mid" className="font-normal">
                      중기
                    </FormLabel>
                  </FormItem>

                  <FormItem className="flex items-center gap-2">
                    <RadioGroupItem value="장기" id="goal-term-long" />
                    <FormLabel htmlFor="goal-term-long" className="font-normal">
                      장기
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <p className="text-sm text-red-600">{errorMsg || ''}</p>

        <Button type="submit" className="bg-secondary-royal hover:bg-secondary-navy w-full">
          AI 금융 리포트 생성하기
        </Button>
      </form>
    </Form>
  )
}
