export type User = {
  id: number
  user_name: string
  nickname: string
  email: string
  phone_number: string
  birth_date: string // YYYY-MM-DD
  profile_image: string | null
  tutorial_check: boolean // 튜토리얼 완료 여부
  asso_check: boolean // 약관 동의 여부
  linked_with_betting: boolean // 베팅포인트 연동 여부
  updated_at: string
}
