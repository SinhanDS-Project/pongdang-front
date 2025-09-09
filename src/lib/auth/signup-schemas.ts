import { z } from 'zod'

/** 만 15세 이상인지 계산 */
function isOver15(birthISO: string) {
  const m = /^\d{4}-\d{2}-\d{2}$/.exec(birthISO)
  if (!m) return false
  const [y, mo, d] = birthISO.split('-').map(Number)
  const birth = new Date(y, mo - 1, d)
  if (isNaN(birth.getTime())) return false

  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const hadBirthdayThisYear = now >= new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
  if (!hadBirthdayThisYear) age -= 1
  return age >= 15
}

/** 하이픈 포함 한국 전화번호(모바일/유선) 간단 정규식 */
export const PHONE_HYPHEN_REGEX = /^(?:01[016789]-\d{3,4}-\d{4}|02-\d{3,4}-\d{4}|0\d{2}-\d{3,4}-\d{4})$/

/* --------------------------------- STEP 1 --------------------------------- */
/**
 * Step 1: 본인확인(이름/생년월일/휴대폰 인증)
 * - birth: YYYY-MM-DD
 * - phone: 하이픈 포함 형식 허용
 * - phoneVerified: 실제 인증 완료 플래그 (true 여야 통과)
 */
export const step1Schema = z.object({
  name: z.string().trim().min(2, '이름을 입력하세요'),
  birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식으로 입력하세요')
    .refine(isOver15, {
      message: '만 15세 미만은 가입할 수 없습니다',
    }),
  phone: z.string().regex(PHONE_HYPHEN_REGEX, '올바른 휴대폰 번호 형식이 아닙니다. 예) 010-1234-5678'),
  phoneVerified: z.boolean().refine((val) => val === true, {
    message: '휴대폰 인증이 필요합니다',
  }),
  phoneCode: z.string().min(1, '인증코드를 입력하세요.'),
})

export type Step1 = z.infer<typeof step1Schema>

/* --------------------------------- STEP 2 --------------------------------- */
/**
 * Step 2: 계정 정보(이메일/비밀번호/닉네임)
 * - 이메일: 필수 + 이메일 형식
 * - 비밀번호: 최소 6자, 대/소문자/숫자/특수문자 각 1개 이상
 * - 비밀번호 확인: 필수 + 일치
 * - emailVerified: 이메일 인증 완료 플래그
 */
export const step2Schema = z
  .object({
    email: z.string().trim().min(1, '이메일을 입력하세요').email('올바른 이메일 주소를 입력하세요.'),
    password: z
      .string()
      .min(6, '비밀번호는 최소 6자 이상이어야 합니다.')
      .regex(/[A-Z]/, '비밀번호에는 대문자가 최소 1개 포함되어야 합니다.')
      .regex(/[a-z]/, '비밀번호에는 소문자가 최소 1개 포함되어야 합니다.')
      .regex(/[0-9]/, '비밀번호에는 숫자가 최소 1개 포함되어야 합니다.')
      .regex(/[^A-Za-z0-9]/, '비밀번호에는 특수문자가 최소 1개 포함되어야 합니다.'),
    passwordConfirm: z.string().min(1, '비밀번호 확인을 입력하세요'),
    emailVerified: z.boolean(),
    emailLockedFromBetting: z.boolean().optional(),
    emailCode: z.string().optional(),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ['passwordConfirm'],
    message: '비밀번호가 일치하지 않습니다.',
  })
  .superRefine((v, ctx) => {
    // 1) 잠금이 아니고 아직 인증 완료가 아니면 코드가 필수
    if (!v.emailLockedFromBetting && v.emailVerified !== true) {
      if (!v.emailCode || v.emailCode.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['emailCode'],
          message: '인증코드를 입력하세요.',
        })
      }
    }
    // 2) 최종적으로는 잠금 상태이거나, 수동 인증을 끝냈어야 함
    if (!(v.emailLockedFromBetting || v.emailVerified === true)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['emailVerified'],
        message: '이메일 인증이 필요합니다',
      })
    }
  })

export type Step2 = z.infer<typeof step2Schema>

/* --------------------------------- STEP 3 --------------------------------- */
/**
 * Step 2: 닉네임 설정(이메일/비밀번호)
 * - 닉네임: 2~20자
 * - nicknameChecked: 닉네임 중복 확인 플래그
 * - termsAgreed: 이용약관 동의 (필수)
 */
export const step3Schema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, '닉네임은 2자 이상이어야 합니다.')
    .max(20, '닉네임은 20자 이하로 입력하세요.')
    .regex(/^[A-Za-z0-9가-힣_]+$/, '한글/영문/숫자/언더스코어(_)만 사용할 수 있습니다.'),
  nicknameChecked: z.boolean().refine((val) => val === true, { message: '닉네임 중복 확인이 필요합니다' }),
  termsAgreed: z.boolean().refine((val) => val === true, { message: '약관에 동의해야 가입할 수 있습니다' }),
})

export type Step3 = z.infer<typeof step3Schema>

/* ------------------------------ 최종(합본) 스키마 ------------------------------ */
/**
 * 위저드 완료 시 서버 전송 전에 한 번 더 전체 검증을 돌리고 싶다면 사용.
 * 이용약관 동의 같은 것도 여기에서 함께 검증하면 좋아요.
 */
export const signupSchema = step1Schema.and(step2Schema).and(step3Schema)

export type SignupPayload = z.infer<typeof signupSchema>
