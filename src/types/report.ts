/* ── 공통 타입 정의 ─────────────────────────── */

// 대출 여부
export type LoanFlag = '있음' | '없음'

// 투자 성향
export type InvestType = '극보수형' | '중립형' | '공격형'

// 목표 기간
export type GoalTerm = '단기' | '중기' | '장기'

// 주요 소비 항목
export type MainCategory = '식비·외식' | '주거·관리비' | '여가·오락' | '교통' | '교육·자기계발' | '보건·의료'

/* ── 입력용 ─────────────────────────── */

// 설문 입력 폼 상태
export type SurveyInput = {
  age: number | ''
  income: number | ''
  spend: number | ''
  main_category: MainCategory
  saving_goal: number | ''
  current_saving: number | ''
  loan: LoanFlag
  invest_type: InvestType
  goal_term: GoalTerm
}

// 서버로 보낼 Payload
export type ReportPayload = {
  age: number
  income: number
  spend: number
  saving_goal: number
  main_category: MainCategory
  current_saving: number
  loan: LoanFlag
  invest_type: InvestType
  goal_term: GoalTerm
}

/* ── 결과 리포트 ─────────────────────────── */

// 금융 상품
export type FinanceProduct = {
  name: string
  institution: string
  recommendation: string
}

// API 응답 구조
export type FinanceReport = {
  title: string
  report: {
    summary?: { title: string; content: string }
    analysis?: {
      title?: string
      content?: string
      consumption_analysis?: { title: string; content: string }
      saving_analysis?: { title: string; content: string }
      investment_analysis?: { title: string; content: string }
    }
    strategy?: {
      title?: string
      content?: string
      debt?: { title: string; content: string }
      saving?: { title: string; content: string }
      invest?: { title: string; content: string }
      products?: FinanceProduct[]
    }
    products?: FinanceProduct[]
    conclusion?: { title: string; content: string }
  }
}

// 에러 응답
export type ApiErrorPayload = {
  message?: string
  detail?: string
  status?: number
}
