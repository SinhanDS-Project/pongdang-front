export type RoomState = {
  current_turn: number
  round: number
  max_round: number
  pot: number
  double_count: number
  double: boolean
}

export type Land = {
  land_id: number
  name: string
  price: number
  toll: number
  owner_id: number | null
  color: string | null
}

export type Player = {
  user_id: number
  nickname: string
  room_id: number
  ready: boolean
  turtle_id: string
  balance: number
  position: number
  turn_order: number
  skip_turn: boolean
  active: boolean
  rank: number | null
  reward: number | null
}

export type Quiz = {
  position: number
  question: string
  choice1: string
  choice2: string
  choice3: string
  choice4: string
  answer_idx: number
  explanation: string
}

export type Game = {
  roomState: RoomState
  lands: Land[]
  players: Player[]
}
