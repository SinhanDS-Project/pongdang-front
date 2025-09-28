import { z } from 'zod'

/* --------------------------------- STEP 1 --------------------------------- */
/**
 * Step 1: 소득 & 소비 & 가장 큰 소비
 * - income: 월 평균 소득
 * - spend: 월 평균 소비
 * - main_category: 가장 큰 비중을 차지하는 소비 항목
 */
export const step1Schema = z.object({
  income: z.number().min(0, '소득은 0 이상이어야 합니다.'),
  spend: z.number().min(0, '소비는 0 이상이어야 합니다.'),
  main_category: z.enum(['식비·외식', '주거·관리', '여가·오락', '교통', '교육·자기계발', '보건·의료']).optional(),
})

export type Step1 = z.infer<typeof step1Schema>

/* --------------------------------- STEP 2 --------------------------------- */
/**
 * Step 2: 저축/투자 자산 & 대출
 * - current_saving: 보유한 저축/투자 자산 총액
 * - loan: 대출(학자금/주택/신용 등) 보유 여부
 */
export const step2Schema = z.object({
  current_saving: z.number(),
  loan: z.enum(['있음', '없음']).optional(), // true: 대출 있음 / false: 없음
})

export type Step2 = z.infer<typeof step2Schema>

/* --------------------------------- STEP 3 --------------------------------- */
/**
 * Step 3: 목표 저축액 & 투자 성향
 * - saving_goal: 목표 저축액
 * - invest_type: 투자 성향 ('안정형'|'중립형'|'공격형')
 * - goal_term:
 */
export const step3Schema = z.object({
  saving_goal: z.number().min(0, '목표 저축액은 0 이상이어야 합니다.'),
  invest_type: z.enum(['안정형', '중립형', '공격형']).optional(),
  goal_term: z.enum(['단기', '중기', '장기']).optional(),
})

export type Step3 = z.infer<typeof step3Schema>

export const reportSchema = step1Schema.and(step2Schema).and(step3Schema)

export type ReportPayload = z.infer<typeof reportSchema>
