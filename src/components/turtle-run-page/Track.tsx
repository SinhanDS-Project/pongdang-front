'use client'

import { useEffect, useMemo, useRef } from 'react'

import { useTurtleStore } from '@/stores/turtle-store'

import { CountdownOverlay } from '@components/turtle-run-page'

import styles from './TurtleRun.module.css'

const TRACKS = 8

// 치수/좌표
const START_MARGIN = 130 // px
const START_BLOCK_W = 38 // px
const TRACK_LENGTH = 4000 // px
const TOTAL_WIDTH = START_MARGIN + TRACK_LENGTH + START_BLOCK_W + 92 // px
const FINISH_LINE_X = START_MARGIN + TRACK_LENGTH // px

// 상단 퍼센트 레이아웃
const CROWD_PCT = 16 // %
const STAND_PCT = 2 // %
const TRACK_PCT = 100 - (CROWD_PCT + STAND_PCT)

export function Track({
  difficulty,
  turtleImages,
  selected,
  onSelect,
  overlayShow = false,
  overlayCount = null,
}: {
  difficulty: 'EASY' | 'NORMAL' | 'HARD'
  turtleImages: string[]
  selected: number | null
  onSelect: (idx: number) => void
  overlayShow?: boolean
  overlayCount?: number | null
}) {
  // DOM refs
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const crowdRef = useRef<HTMLDivElement | null>(null)
  const crowdStandRef = useRef<HTMLDivElement | null>(null)
  const turtleRefs = useRef<(HTMLImageElement | null)[]>([])

  // 패닝 상태
  const followRef = useRef(false)
  const panRef = useRef(0)
  const panTargetRef = useRef(0)
  const selPxSmoothRef = useRef(0) // 선택 거북이의 스무딩된 px
  const startedFollowRef = useRef(false)

  // 실제 포지션 수신 전에는 패닝 금지
  const hadPositions = useRef(false)
  useEffect(() => {
    const unsub = useTurtleStore.subscribe((s) => {
      const p = s.positions
      if (!hadPositions.current && p.length > 0 && p.some((v) => (v ?? 0) > 0)) {
        hadPositions.current = true
      }
    })
    return () => unsub()
  }, [])

  const laneRange = useMemo(() => {
    if (difficulty === 'EASY') return [2, 5] as const
    if (difficulty === 'NORMAL') return [1, 6] as const
    return [0, 7] as const
  }, [difficulty])

  const turtles = useMemo(() => {
    const arr: { lane: number; idx: number }[] = []
    let idx = 0
    for (let lane = 0; lane < TRACKS; lane++) {
      if (lane >= laneRange[0] && lane <= laneRange[1]) arr.push({ lane, idx: idx++ })
    }
    return arr
  }, [laneRange])

  // 메인 루프(소켓 수신 → setPositions, 보간 → DOM 업데이트 + 패닝)
  useEffect(() => {
    let raf = 0
    let mounted = true

    const loop = () => {
      if (!mounted) return

      // --- 1) WS 메시지 소비 (있을 때만) ---
      // 외부(소켓 수신부)에서 raceStream.lastPositions = number[] 로 넣어주면,
      // 여기서 "한 프레임만" 읽고 비웁니다.
      // 이 부분은 애니메이션의 연속성과는 별개로, 데이터 소스만 업데이트합니다.

      // --- 삭제 ---

      // --- 2) 보간 로직은 "매 프레임" 실행 ---
      // hadNewMsgRef 체크를 제거하여 항상 보간을 수행하도록 합니다.
      const st = useTurtleStore.getState()
      st.tickLerp(0.12) // 부드러운 움직임을 위해 계속 호출

      // 보간 결과
      const displayedNow = st.displayed ?? []

      // --- 3) DOM 업데이트도 "매 프레임" 실행 ---
      for (let i = 0; i < displayedNow.length; i++) {
        const el = turtleRefs.current[i]
        if (!el || !el.isConnected || !el.parentElement) continue

        const progressRaw = displayedNow[i] ?? 0
        const progress = Math.max(0, Math.min(100, progressRaw))

        const rawLeft = START_MARGIN / 2 + (TRACK_LENGTH * progress) / 100
        const left = Math.round(rawLeft)

        el.style.setProperty('--x', `${left}px`)
      }

      // --- 4) 패닝 계산 (selected가 있을 때만) ---
      const vp = viewportRef.current
      if (vp && typeof selected === 'number' && hadPositions.current) {
        const selProgress = Math.min(100, displayedNow[selected] ?? 0)

        const START_TH = 6
        const STOP_TH = 4
        if (!startedFollowRef.current && selProgress > START_TH && selProgress < 90) {
          startedFollowRef.current = true
          followRef.current = true
        } else if (startedFollowRef.current && selProgress < STOP_TH) {
          startedFollowRef.current = false
        }

        const rawSelPx = START_MARGIN / 2 + (selProgress / 100) * TRACK_LENGTH
        selPxSmoothRef.current =
          selPxSmoothRef.current === 0 ? rawSelPx : selPxSmoothRef.current + (rawSelPx - selPxSmoothRef.current) * 0.25

        const vpW = vp.clientWidth
        let panTarget = selPxSmoothRef.current - vpW * 0.45

        const maxPan = Math.max(0, TOTAL_WIDTH - vpW)
        if (panTarget < 0) panTarget = 0
        if (panTarget > maxPan) panTarget = maxPan

        panTargetRef.current = followRef.current ? panTarget : 0
      } else {
        panTargetRef.current = 0
      }

      // 적용 단계 (데드존 + 감쇠 + 스텝 제한)
      const target = panTargetRef.current
      const cur = panRef.current
      let delta = target - cur

      const DEADZONE = 8
      const ALPHA = 0.1
      const MAX_STEP = 40

      if (Math.abs(delta) <= DEADZONE) {
        panRef.current = target
      } else {
        let step = delta * ALPHA
        if (step > MAX_STEP) step = MAX_STEP
        if (step < -MAX_STEP) step = -MAX_STEP
        panRef.current = cur + step
      }

      const px = -panRef.current
      if (containerRef.current) containerRef.current.style.transform = `translate3d(${px}px,0,0)`
      if (crowdRef.current) crowdRef.current.style.transform = `translate3d(${px}px,0,0)`
      if (crowdStandRef.current) crowdStandRef.current.style.transform = `translate3d(${px}px,0,0)`

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => {
      mounted = false
      cancelAnimationFrame(raf)
      turtleRefs.current = []
    }
  }, [selected])

  return (
    // 부모(#gameRoot)가 relative + 크기를 가지고 있다는 전제
    <div ref={viewportRef} id="trackViewport" className="relative h-full w-full overflow-hidden">
      {/* Crowd */}
      <div
        ref={crowdRef}
        className="absolute top-0 left-0 z-[10] bg-[url('/crowd.png')] bg-[length:auto_100%] bg-left-bottom bg-repeat-x will-change-transform"
        style={{ width: TOTAL_WIDTH, height: `${CROWD_PCT}%` }}
      />

      {/* Stand */}
      <div
        ref={crowdStandRef}
        className="absolute left-0 z-[20] bg-[repeating-linear-gradient(-45deg,#e9e9ef_0_7px,#636c92_7px_12px,#b99a83_12px_18px)] shadow-[inset_0_-2px_0_#d1d5db] will-change-transform"
        style={{ width: TOTAL_WIDTH, top: `${CROWD_PCT}%`, height: `${STAND_PCT}%` }}
      />

      {/* Track */}
      <div
        ref={containerRef}
        id="trackContainer"
        className="absolute right-0 bottom-0 left-0 z-[30] will-change-transform"
        style={{
          top: `calc(${CROWD_PCT}% + ${STAND_PCT}%)`,
          height: `${TRACK_PCT}%`,
          width: TOTAL_WIDTH,
        }}
      >
        {/* START */}
        <div
          className="absolute top-0 z-[40] flex h-full w-[38px] flex-col items-center justify-between rounded bg-[repeating-linear-gradient(90deg,#fff_0_19px,#2196f3_19px_38px)] shadow"
          style={{ left: START_MARGIN }}
        >
          {['S', 'T', 'A', 'R', 'T'].map((c, i) => (
            <span key={i} className="text-[clamp(48px,5svh,90px)] font-extrabold text-white drop-shadow">
              {c}
            </span>
          ))}
        </div>

        {/* 레인 + 거북이 */}
        {Array.from({ length: TRACKS }).map((_, lane) => (
          <div
            key={lane}
            className="absolute left-0 bg-[#e1764e] shadow-[inset_0_1px_0_#ffffff,inset_0_-1px_0_#ffffff,0_1.5px_7px_rgba(101,42,21,0.14)]"
            style={{
              width: TOTAL_WIDTH,
              top: `calc((100% / ${TRACKS}) * ${lane})`,
              height: `calc(100% / ${TRACKS})`,
            }}
          >
            <div className="pointer-events-none absolute top-1/2 left-8 -translate-y-1/2 text-[clamp(28px,4.5svh,60px)] leading-none font-extrabold text-[#fffbe6] drop-shadow">
              {lane + 1}
            </div>

            {turtles
              .filter((t) => t.lane === lane)
              .map(({ idx }) => {
                const positionsNow = useTurtleStore.getState().positions
                const isRacing = (positionsNow[idx] ?? 0) > 0
                const src = turtleImages[idx] ?? '/turtle-fallback.png'

                return (
                  /* 바깥 래퍼: X 이동만 담당 (CSS 변수로 전달) */
                  <div
                    key={idx}
                    ref={(el: HTMLImageElement | null) => {
                      turtleRefs.current[idx] = el
                    }}
                    className={`absolute z-[45] h-[70%] max-h-[84px] ${styles.turtleWrap} ${selected === idx ? styles.selected : ''}`}
                    style={{ top: '50%' }}
                  >
                    {/* X를 적용받는 래퍼 (transition도 여기에) */}
                    <div className={`turtleWrap ${selected === idx ? 'outline outline-2 outline-yellow-400' : ''}`}>
                      {/* 안쪽 요소: 애니메이션은 Y만 살짝 흔들기 */}
                      <img
                        src={src}
                        alt={`turtle-${idx + 1}`}
                        width={64}
                        height={64}
                        className={isRacing ? styles.racing : ''}
                        draggable={false}
                        onClick={() => onSelect(idx)}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        ))}

        {/* FINISH */}
        <div
          className="absolute top-0 z-[40] flex h-full w-[38px] flex-col items-center justify-between rounded bg-[repeating-linear-gradient(90deg,#fff_0_19px,#d62c16_19px_38px)] shadow"
          style={{ left: FINISH_LINE_X }}
        >
          {['F', 'I', 'N', 'I', 'S', 'H'].map((c, i) => (
            <span key={i} className="text-[clamp(48px,5svh,90px)] font-extrabold text-white drop-shadow">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* ✅ 오버레이: viewport 바로 위에 덮기 */}
      <CountdownOverlay count={overlayCount ?? null} show={overlayShow} />
    </div>
  )
}
