export type Difficulty = 'EASY' | 'NORMAL' | 'HARD'
export type Rank = 'FIRST' | 'SECOND' | 'THIRD' | 'LOSE'

export interface RoomDetail {
  id: number
  host_id: number
  level: Difficulty
  entry_fee: number
}

export interface PlayerInfo {
  user_id: number
  turtle_id: number
  entry_fee: number
}

export type WSMessage =
  | { type: 'race_update'; data: number[] }
  | {
      type: 'race_finish'
      winner: number
      results: Array<{ user_id: number; rank: Rank; pointChange: number }>
    }
  | { type: 'force_exit'; targetUrl: string }
  | { type: 'end'; target: string }
  | { type: 'game_start'; roomId: number }

// ✅ 클라이언트가 서버로 보내는 메시지
export type OutgoingMsg = { type: 'end'; target: string } | { type: 'game_start'; roomId: number }
