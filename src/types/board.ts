export type Category = 'NOTICE' | 'FREE' | 'EVENT'
export type Board = {
  id: number
  title: string
  content: string
  created_at: Date
  nickname: string
  category: string
  like_count: number
  view_count: number
  user_id: number
  reply_count: number
  profile_image: string
}

export type Reply = {
  id: number
  content: string
  created_at: string
  writer: string
  user_id: number
  profile_image: string
}

// API 응답 타입
export type PageResp = {
  boards: {
    content: Board[]
    total_pages: number
    number: number
  }
}
