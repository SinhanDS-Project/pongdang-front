'use client'

import { useState, useMemo } from 'react'
import type { SurveyInput, ReportPayload } from '../../types/report'

/* ── 유틸 ─────────────────────────────── */
function parseNumber(v: string): number | '' {
  if (!v.trim()) return ''
  const n = Number(v.replaceAll(',', ''))
  return Number.isFinite(n) && n >= 0 ? n : ''
}
const fmt = (n?: number | '') => (typeof n === 'number' ? n.toLocaleString() : '')

export default function ReportForm({
  onSubmit,
  loading,
}: {
  onSubmit: (payload: ReportPayload) => void
  loading: boolean
}) {
  const [form, setForm] = useState<SurveyInput>({
    age: '',
    income: '',
    spend: '',
    main_category: '식비·외식',
    saving_goal: '',
    current_saving: '',
    loan: '없음',
    invest_type: '중립형',
    goal_term: '중기',
  })

  // 유효성 검사
  const isValid = useMemo(() => {
    const requiredValid = ['age', 'income', 'spend', 'saving_goal', 'current_saving'].every(
      (k) => typeof form[k as keyof SurveyInput] === 'number',
    )

    // 현재 자산이 목표 저축액보다 크지 않아야 함
    const savingCheck =
      typeof form.current_saving === 'number' && typeof form.saving_goal === 'number'
        ? form.current_saving <= form.saving_goal
        : true

    return requiredValid && savingCheck
  }, [form])

  const onNumChange = (key: keyof SurveyInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: parseNumber(e.target.value) }))
  const onSelectChange = (key: keyof SurveyInput) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))
  const onRadioChange = (key: keyof SurveyInput, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    const payload: ReportPayload = {
      age: form.age as number,
      income: (form.income as number) * 10000, // 만원 → 원 변환
      spend: (form.spend as number) * 10000,
      saving_goal: (form.saving_goal as number) * 10000,
      current_saving: (form.current_saving as number) * 10000,
      main_category: form.main_category,
      loan: form.loan,
      invest_type: form.invest_type,
      goal_term: form.goal_term,
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 1. 기본 정보 */}
      <Section step={1} title="현재 만 나이를 알려주세요.">
        <LabeledInput
          label="나이"
          value={form.age === '' ? '' : String(form.age)}
          onChange={onNumChange('age')}
          prefix="만"
          placeholder="예) 32"
        />
      </Section>

      {/* 2. 소득 */}
      <Section step={2} title="월 평균 소득은 얼마인가요?">
        <LabeledInput
          label="월 소득(만원)"
          value={fmt(form.income)}
          onChange={onNumChange('income')}
          prefix="₩"
          placeholder="예) 250"
        />
      </Section>

      {/* 3. 소비 */}
      <Section step={3} title="월 평균 소비(지출)는 얼마인가요?">
        <LabeledInput
          label="월 소비(만원)"
          value={fmt(form.spend)}
          onChange={onNumChange('spend')}
          prefix="₩"
          placeholder="예) 250"
        />
      </Section>

      {/* 4. 소비 항목 */}
      <Section step={4} title="가장 큰 비중을 차지하는 소비 항목은 무엇인가요?">
        <div className="flex flex-col gap-4 md:flex-row">
          {/* 드롭다운 */}
          <div className="md:w-1/3">
            <LabeledSelect
              label="소비 항목"
              value={form.main_category}
              onChange={onSelectChange('main_category')}
              options={['식비·외식', '주거·관리', '여가·오락', '교통', '교육·자기계발', '보건·의료'] as const}
            />
          </div>

          {/* 항상 표시되는 설명 테이블 */}
          <div className="overflow-x-auto rounded-lg border md:w-2/3">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="w-28 border px-3 py-2">항목</th>
                  <th className="border px-3 py-2">설명</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-3 py-2 font-medium">식비·외식</td>
                  <td className="border px-3 py-2">일상적인 식사, 카페, 외식 등 기본적인 생활 식비와 외부 음식 소비</td>
                </tr>
                <tr>
                  <td className="border px-3 py-2 font-medium">주거·관리</td>
                  <td className="border px-3 py-2">주거비(전세, 월세, 대출 이자), 관리비, 공과금 등 거주 관련 지출</td>
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
                  <td className="border px-3 py-2">학원, 강의, 도서, 온라인 수업 등 자기계발 및 자녀 교육 관련 지출</td>
                </tr>
                <tr>
                  <td className="border px-3 py-2 font-medium">보건·의료</td>
                  <td className="border px-3 py-2">병원 진료비, 약값, 건강관리비, 보험료 등 건강 관련 소비</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* 5. 목표 저축액 */}
      <Section step={5} title="달성하고 싶은 총 목표 저축액은 얼마인가요?">
        <LabeledInput
          label="목표 저축(만원)"
          value={fmt(form.saving_goal)}
          onChange={onNumChange('saving_goal')}
          prefix="₩"
          placeholder="예) 10000 (1억)"
        />
      </Section>

      {/* 6. 현재 자산 */}
      <Section step={6} title="현재 보유한 저축/투자 자산 총액은 얼마인가요?">
        <LabeledInput
          label="현재 자산(만원)"
          value={fmt(form.current_saving)}
          onChange={onNumChange('current_saving')}
          prefix="₩"
          placeholder="예) 500"
        />
        {/* 경고 메시지 */}
        {typeof form.current_saving === 'number' &&
          typeof form.saving_goal === 'number' &&
          form.current_saving > form.saving_goal && (
            <p className="mt-2 text-sm text-rose-600">
              ⚠️ 현재 자산은 목표 저축액({fmt(form.saving_goal)}만원)보다 클 수 없습니다.
            </p>
          )}
      </Section>

      {/* 7. 대출 여부 */}
      <Section step={7} title="현재 대출(학자금/주택/신용 등) 보유 여부를 알려주세요.">
        <LabeledSelect
          label="대출 여부"
          value={form.loan}
          onChange={onSelectChange('loan')}
          options={['있음', '없음'] as const}
        />
      </Section>

      {/* 8. 투자 성향 */}
      <Section step={8} title="본인의 투자 성향이 가장 가까운 것은 무엇인가요?">
        <div className="space-y-3">
          <RadioOption
            name="invest_type"
            value="극보수형"
            checked={form.invest_type === '극보수형'}
            onChange={() => onRadioChange('invest_type', '극보수형')}
            label="나는 손실 위험 없이 안전하게 자금을 지키고 싶다."
          />
          <RadioOption
            name="invest_type"
            value="중립형"
            checked={form.invest_type === '중립형'}
            onChange={() => onRadioChange('invest_type', '중립형')}
            label="나는 수익과 안정 사이에서 균형을 맞추고 싶다."
          />
          <RadioOption
            name="invest_type"
            value="공격형"
            checked={form.invest_type === '공격형'}
            onChange={() => onRadioChange('invest_type', '공격형')}
            label="나는 높은 수익을 위해 위험을 감수할 수 있다."
          />
        </div>
      </Section>

      {/* 9. 목표 기간 */}
      <Section step={9} title="목표를 달성하고 싶은 기간은 어느 정도인가요?">
        <div className="space-y-3">
          <RadioOption
            name="goal_term"
            value="단기"
            checked={form.goal_term === '단기'}
            onChange={() => onRadioChange('goal_term', '단기')}
            label="1~3년 이내 목표"
          />
          <RadioOption
            name="goal_term"
            value="중기"
            checked={form.goal_term === '중기'}
            onChange={() => onRadioChange('goal_term', '중기')}
            label="3~7년 이내 목표"
          />
          <RadioOption
            name="goal_term"
            value="장기"
            checked={form.goal_term === '장기'}
            onChange={() => onRadioChange('goal_term', '장기')}
            label="7년 이상, 장기 투자/저축 포함"
          />
        </div>
      </Section>

      {/* 제출 */}
      <div className="sticky bottom-4 z-10">
        <div className="rounded-2xl bg-white/80 p-3 shadow-lg ring-1 ring-black/5 backdrop-blur">
          {!isValid && (
            <p className="mb-2 text-center text-sm font-medium text-rose-600">
              ⚠️ 모든 숫자 항목을 올바르게 입력해야 금융 리포트를 생성할 수 있습니다.
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full rounded-xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? '생성 중…' : '금융 리포트 생성'}
          </button>
        </div>
      </div>
    </form>
  )
}

/* ── Sub Components ───────────────────────────── */
function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">{step}</div>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function LabeledInput({
  label,
  value,
  onChange,
  prefix,
  placeholder,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  prefix?: string
  placeholder?: string
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative mt-1">
        {prefix && (
          <span className="absolute inset-y-0 left-0 grid w-9 place-items-center text-gray-400">{prefix}</span>
        )}
        <input
          inputMode="numeric"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full rounded-lg border px-3 py-2 text-[15px] focus:ring-4 focus:ring-blue-100 ${
            prefix ? 'pl-10' : ''
          }`}
        />
      </div>
    </div>
  )
}

function LabeledSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: readonly T[]
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium">{label}</label>
      <select
        className="mt-1 w-full rounded-lg border px-3 py-2 text-[15px] focus:ring-4 focus:ring-blue-100"
        value={value}
        onChange={onChange}
      >
        {options.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  )
}

function RadioOption({
  name,
  value,
  checked,
  onChange,
  label,
  desc,
}: {
  name: string
  value: string
  checked: boolean
  onChange: () => void
  label: string
  desc?: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="mt-1" />
      <span>
        <span className="font-medium">{label}</span>
        {desc && <span className="ml-1 text-sm text-gray-500">{desc}</span>}
      </span>
    </label>
  )
}
