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
}

export type Reply = {
  id: number
  content: string
  created_at: string
  writer: string
  user_id: number
}
