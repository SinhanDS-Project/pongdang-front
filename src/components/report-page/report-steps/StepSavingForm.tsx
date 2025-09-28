'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { type Step2, step2Schema } from '@/lib/report/report-schemas'

import { useReportStore } from '@/stores/report-store'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const onlyDigits = (v: string) => v.replace(/\D/g, '')

export function formatMoney(v: string) {
  const d = onlyDigits(v)
  if (!d) return ''
  // 정수형으로 변환 후 localeString
  return Number(d).toLocaleString('ko-KR')
}

export function StepSavingForm() {
  const setStep = useReportStore((s) => s.setStep)
  const patch = useReportStore((s) => s.patch)
  const currentSavingSnap = useReportStore((s) => s.current_saving ?? 0)
  const loanSnap = useReportStore((s) => s.loan ?? undefined)

  const defaultValues = useMemo<Step2>(
    () => ({
      current_saving: currentSavingSnap,
      loan: loanSnap,
    }),
    [currentSavingSnap, loanSnap],
  )

  const form = useForm<Step2>({
    resolver: zodResolver(step2Schema),
    defaultValues,
    mode: 'onChange',
  })

  async function onSubmit(values: Step2) {
    patch(values) // zustand에 저장
    setStep(3) // 다음 스텝
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        {/* 보유한 저축/투자 자산 총액 */}
        <FormField
          control={form.control}
          name="current_saving"
          render={({ field }) => (
            <FormItem>
              <FormLabel>보유한 저축/투자 자산 총액은 얼마인가요? (단위: 만원)</FormLabel>
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

        {/* 보유한 대출(학자금/주택/신용 등) */}
        <FormField
          control={form.control}
          name="loan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>대출(학자금/주택/신용 등)을 보유하고 있나요?</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value ?? ''} className="flex gap-4">
                  <FormItem className="flex items-center gap-2">
                    <RadioGroupItem value="있음" id="loan-yes" />
                    <FormLabel htmlFor="loan-yes">예</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center gap-2">
                    <RadioGroupItem value="없음" id="loan-no" />
                    <FormLabel htmlFor="loan-no">아니오</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="bg-secondary-royal hover:bg-secondary-navy w-full">
          다음
        </Button>
      </form>
    </Form>
  )
}
