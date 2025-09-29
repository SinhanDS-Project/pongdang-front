'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { type Step1, step1Schema } from '@/lib/report/report-schemas'

import { useReportStore } from '@/stores/report-store'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const onlyDigits = (v: string) => v.replace(/\D/g, '')

export function formatMoney(v: string) {
  const d = onlyDigits(v)
  if (!d) return ''
  // 정수형으로 변환 후 localeString
  return Number(d).toLocaleString('ko-KR')
}

export function StepIncomeForm() {
  const setStep = useReportStore((s) => s.setStep)
  const patch = useReportStore((s) => s.patch)
  const incomeSnap = useReportStore((s) => s.income ?? 0)
  const spendSnap = useReportStore((s) => s.spend ?? 0)
  const mainCategorySnap = useReportStore((s) => s.main_category ?? undefined)

  const defaultValues = useMemo<Step1>(
    () => ({
      income: incomeSnap,
      spend: spendSnap,
      main_category: mainCategorySnap,
    }),
    [incomeSnap, spendSnap, mainCategorySnap],
  )

  const form = useForm<Step1>({
    resolver: zodResolver(step1Schema),
    defaultValues,
    mode: 'onChange',
  })

  const income = form.watch('income')
  const spend = form.watch('spend')
  const main_category = form.watch('main_category')

  const canSend = useMemo(() => {
    return income > 0 && spend > 0 && main_category
  }, [income, spend, main_category])

  async function onSubmit(values: Step1) {
    patch(values) // zustand에 저장
    setStep(2) // 다음 스텝
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        {/* 월 평균 소득 */}
        <FormField
          control={form.control}
          name="income"
          render={({ field }) => (
            <FormItem>
              <FormLabel>월 평균 소득은 얼마인가요? (단위: 만원)</FormLabel>
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

        {/* 월 평균 소비 */}
        <FormField
          control={form.control}
          name="spend"
          render={({ field }) => (
            <FormItem>
              <FormLabel>월 평균 소비는 얼마인가요? (단위: 만원)</FormLabel>
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

        {/* 가장 큰 소비 항목 */}
        <FormField
          control={form.control}
          name="main_category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="items-end justify-between">
                가장 큰 소비 항목은 무엇인가요?
                <HoverCard>
                  <HoverCardTrigger asChild className="">
                    <div className="text-xs font-light hover:underline">소비 항목</div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="w-28 border px-3 py-2">항목</th>
                            <th className="border px-3 py-2">설명</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border px-3 py-2 font-medium">식비·외식</td>
                            <td className="border px-3 py-2">
                              일상적인 식사, 카페, 외식 등 기본적인 생활 식비와 외부 음식 소비
                            </td>
                          </tr>
                          <tr>
                            <td className="border px-3 py-2 font-medium">주거·관리</td>
                            <td className="border px-3 py-2">
                              주거비(전세, 월세, 대출 이자), 관리비, 공과금 등 거주 관련 지출
                            </td>
                          </tr>
                          <tr>
                            <td className="border px-3 py-2 font-medium">여가·오락</td>
                            <td className="border px-3 py-2">영화, 공연, 여행, 취미 활동 등 여가 생활과 오락성 소비</td>
                          </tr>
                          <tr>
                            <td className="border px-3 py-2 font-medium">교통</td>
                            <td className="border px-3 py-2">대중교통, 차량 유지비, 주유비, 교통 관련 지출</td>
                          </tr>
                          <tr>
                            <td className="border px-3 py-2 font-medium">교육·자기계발</td>
                            <td className="border px-3 py-2">
                              학원, 강의, 도서, 온라인 수업 등 자기계발 및 자녀 교육 관련 지출
                            </td>
                          </tr>
                          <tr>
                            <td className="border px-3 py-2 font-medium">보건·의료</td>
                            <td className="border px-3 py-2">
                              병원 진료비, 약값, 건강관리비, 보험료 등 건강 관련 소비
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl className="w-full">
                  <SelectTrigger>
                    <SelectValue placeholder="소비 항목 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="식비·외식">식비·외식</SelectItem>
                  <SelectItem value="주거·관리">주거·관리</SelectItem>
                  <SelectItem value="여가·오락">여가·오락</SelectItem>
                  <SelectItem value="교통">교통</SelectItem>
                  <SelectItem value="교육·자기계발">교육·자기계발</SelectItem>
                  <SelectItem value="보건·의료">보건·의료</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="bg-secondary-royal hover:bg-secondary-navy w-full" disabled={!canSend}>
          다음
        </Button>
      </form>
    </Form>
  )
}
