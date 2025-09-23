import { create } from 'zustand'

/** 진행률 클램프 유틸 */
const clamp01_100 = (n: number) => {
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 100) return 100
  return n
}

/** 서버 색상 고정 순서 (인덱스 매핑용) */
export const COLOR_ORDER = [
  'green','orange','pink','yellow','brown','purple','gray','blue',
] as const
type TurtleColor = typeof COLOR_ORDER[number]
const COLOR_TO_INDEX: Record<string, number> =
  Object.fromEntries(COLOR_ORDER.map((c, i) => [c, i]))


interface TurtleState {
  // 게임/선택 상태
  isHost: boolean
  selectedTurtle: string | null // 0-based (없으면 null)
  setIsHost: (v: boolean) => void
  setSelected: (tid: string | null) => void

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

   /** 선택 색상 문자열 → 인덱스(number|null) (패닝용) */
  getSelectedIndex: (total: number) => number | null


  /**
   * 한 프레임 보간 (displayed -> positions 로 alpha 만큼 이동)
   * alpha는 0~1. 기본값 0.12 (너무 작으면 느리고, 크면 툭툭 튄 느낌)
   */
  tickLerp: (alpha?: number) => void

  // ✅ 결과 연출용 오버라이드
  finishOverrideActive: boolean
  finishOverride: number[] | null
  applyFinishOverride: (xs: number[]) => void
  clearFinishOverride: () => void

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

  // ✅ 오버라이드 초기값
  finishOverrideActive: false,
  finishOverride: null,

  setPositions: (nextIn) => {
    const next = nextIn.map(clamp01_100)

    const { displayed } = get()
    let newDisplayed: number[]
    if (displayed.length === next.length) {
      newDisplayed = displayed
    } else if (displayed.length === 0) {
      newDisplayed = new Array(next.length).fill(0)
    } else if (displayed.length < next.length) {
      const last = displayed[displayed.length - 1] ?? 0
      newDisplayed = displayed.concat(new Array(next.length - displayed.length).fill(last))
    } else {
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

  // ✅ 결과 연출용 좌표 강제 적용
  applyFinishOverride: (xs) => {
    const arr = Array.isArray(xs) ? xs.map(clamp01_100) : []
    set({
      finishOverrideActive: true,
      finishOverride: arr,
    })
  },

  // ✅ 오버라이드 해제
  clearFinishOverride: () => {
    set({ finishOverrideActive: false, finishOverride: null })
  },

  resetRace: () => {
    set({
      positions: [],
      displayed: [],
      // ✅ 리셋 시 오버라이드도 함께 초기화
      finishOverrideActive: false,
      finishOverride: null,
    })
  },

  getSelectedIndex: (total: number) => {
    const key = get().selectedTurtle
    if (!key) return null
    const idx = COLOR_TO_INDEX[String(key).toLowerCase()]
    return Number.isInteger(idx) && idx >= 0 && idx < total ? idx : null
  },
}))
