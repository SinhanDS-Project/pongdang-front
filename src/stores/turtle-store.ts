import { create } from 'zustand'

/** 진행률 클램프 유틸 */
const clamp01_100 = (n: number) => {
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 100) return 100
  return n
}

interface TurtleState {
  // 게임/선택 상태
  isHost: boolean
  selectedTurtle: number | null // 0-based (없으면 null)
  setIsHost: (v: boolean) => void
  setSelected: (tid: number | null) => void

  // 레이스 진행률
  /** 소켓으로 받은 "원시" 진행률 (0~100) */
  positions: number[]
  /** 화면에 그릴 "보간된" 진행률 (0~100) */
  displayed: number[]

  /**
   * 서버에서 받은 진행률을 반영.
   * 길이가 달라지면 displayed도 자동으로 길이를 맞추고 부족한 부분은 마지막 값(또는 0)으로 채웁니다.
   */
  setPositions: (next: number[]) => void

  /**
   * 한 프레임 보간 (displayed -> positions 로 alpha 만큼 이동)
   * alpha는 0~1. 기본값 0.12 (너무 작으면 느리고, 크면 툭툭 튄 느낌)
   */
  tickLerp: (alpha?: number) => void

  /** 레이스 관련 상태 초기화 */
  resetRace: () => void
}

export const useTurtleStore = create<TurtleState>((set, get) => ({
  // --- 기본 상태 ---
  isHost: false,
  selectedTurtle: null,
  setIsHost: (v) => set({ isHost: v }),
  setSelected: (tid) => set({ selectedTurtle: tid }),

  // --- 레이스 상태 ---
  positions: [],
  displayed: [],

  setPositions: (nextIn) => {
    // 안전 클램프 + 복사
    const next = nextIn.map(clamp01_100)

    const { displayed } = get()
    // displayed 길이를 next와 맞춤
    let newDisplayed: number[]
    if (displayed.length === next.length) {
      newDisplayed = displayed
    } else if (displayed.length === 0) {
      // 첫 수신이면 0에서 시작 (또는 next를 바로 복사하고 싶다면 next로 설정)
      newDisplayed = new Array(next.length).fill(0)
    } else if (displayed.length < next.length) {
      // 더 길어졌으면 부족한 부분은 마지막 값(또는 0)으로 채우기
      const last = displayed[displayed.length - 1] ?? 0
      newDisplayed = displayed.concat(new Array(next.length - displayed.length).fill(last))
    } else {
      // 줄어들었으면 자르기
      newDisplayed = displayed.slice(0, next.length)
    }

    set({ positions: next, displayed: newDisplayed })
  },

  tickLerp: (alpha = 0.12) => {
    const { positions, displayed } = get()
    if (positions.length === 0) return

    const out = new Array(positions.length)
    for (let i = 0; i < positions.length; i++) {
      const from = displayed[i] ?? 0
      const to = positions[i] ?? 0
      out[i] = clamp01_100(from + (to - from) * alpha)
    }
    set({ displayed: out })
  },

  resetRace: () => {
    set({ positions: [], displayed: [] })
  },
}))
