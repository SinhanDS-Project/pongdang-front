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

const rankDepth = (rank: string) => rank === 'FIRST' ? 4160 : rank === 'SECOND' ? 4145 : rank === 'THIRD' ? 4130 : 0.01

export function Track({
  difficulty,
  turtleImages,
  selected,
  onSelect,
  overlayShow = false,
  overlayCount = null,

  finishResults,
}: {
  difficulty: 'EASY' | 'NORMAL' | 'HARD'
  turtleImages: string[]
  selected: number | null
  onSelect: (idx: number) => void
  overlayShow?: boolean
  overlayCount?: number | null

  finishResults?: { idx: number; rank: string }[]
}) {
  // DOM refs
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const crowdRef = useRef<HTMLDivElement | null>(null)
  const crowdStandRef = useRef<HTMLDivElement | null>(null)
  const turtleRefs = useRef<(HTMLDivElement | null)[]>([])
  const lockPanRef = useRef<number | null>(null); // finish 순간 pan 고정값

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

  
  const finished = Array.isArray(finishResults) && finishResults.length > 0
  const finishMap = useMemo(() => {
    const m = new Map<number, string>()
    finishResults?.forEach(({ idx, rank }) => m.set(idx, String(rank)))
    return m 
  }, [finishResults])

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
      // const displayedNow = st.displayed ?? []
      const N = turtles.length
      const selectedIdx = useTurtleStore.getState().getSelectedIndex(N)
      const pos = st.positions ?? []
      const dispRaw = st.displayed ?? []
      const displayedNow = Array.from({ length : N }, (_, i) => {
        const v = dispRaw[i] ?? pos[i] ?? 0
        return Number.isFinite(v) ? v: 0
      })

      // --- 3) DOM 업데이트도 "매 프레임" 실행 ---
      for (let i = 0; i < displayedNow.length; i++) {
        const el = turtleRefs.current[i]
        if (!el || !el.isConnected || !el.parentElement) continue
        
        let left: number
        if(finished && finishMap.has(i)) {
          // ✅ 종료 후: 등수별 깊이로 결승선 뒤쪽 정착
          const rank = finishMap.get(i)!
          const depth = rankDepth(rank)
          left = Math.round(depth)
        } else {
          const progressRaw = displayedNow[i] ?? 0
          const progress = Math.max(0, Math.min(100, progressRaw))

          const rawLeft = START_MARGIN / 2 + (TRACK_LENGTH * progress) / 100
          left = Math.round(rawLeft)
        }

        el.style.setProperty('--x', `${left}px`)
      }

      // --- 4) 패닝 계산 (selected가 있을 때만) ---
      const vp = viewportRef.current;
      if (!vp) {
        raf = requestAnimationFrame(loop);
        return;
      }

      const vpW = vp.clientWidth;
      const maxPan = Math.max(0, TOTAL_WIDTH - vpW);

      if (finished) {
        // ✅ 경기 종료: '끝난 그 프레임의 pan'을 고정해서 계속 유지
        if (lockPanRef.current == null) {
          const pin = Math.max(0, Math.min(maxPan, panRef.current)); // 현재 pan을 고정점으로
          lockPanRef.current = pin;
          panTargetRef.current = pin;
          panRef.current = pin; // 첫 프레임 점프 방지
        } else {
          panTargetRef.current = lockPanRef.current;
        }
        followRef.current = false;
        startedFollowRef.current = false;
      } else {
        // 🟢 진행 중(기존 로직)
        if (
          typeof selectedIdx === 'number' &&
          selectedIdx >= 0 &&
          selectedIdx < displayedNow.length &&
          hadPositions.current
        ) {
          const selProgress = Math.min(100, displayedNow[selectedIdx] ?? 0);
          const selWorldX = START_MARGIN / 2 + (selProgress / 100) * TRACK_LENGTH;
          const screenX = selWorldX - panRef.current;

          const MID_RATIO = 0.50;
          const HYST = 24;
          const startX = vpW * MID_RATIO;
          const stopX = startX - HYST;

          if (!startedFollowRef.current && screenX >= startX && selProgress < 90) {
            startedFollowRef.current = true;
            followRef.current = true;
          } else if (startedFollowRef.current && screenX <= stopX) {
            startedFollowRef.current = false;
            followRef.current = false;
          }

          if (selPxSmoothRef.current === 0) selPxSmoothRef.current = selWorldX;
          else selPxSmoothRef.current += (selWorldX - selPxSmoothRef.current) * 0.25;

          let panTarget = selPxSmoothRef.current - vpW * 0.5; // 중앙 정렬
          if (panTarget < 0) panTarget = 0;
          if (panTarget > maxPan) panTarget = maxPan;

          panTargetRef.current = followRef.current ? panTarget : Math.max(0, Math.min(maxPan, panTargetRef.current));
        } else {
          // ❗ 선택 없다고 0으로 리셋하지 말고 현재 값 유지
          panTargetRef.current = Math.max(0, Math.min(maxPan, panTargetRef.current));
          followRef.current = false;
          startedFollowRef.current = false;
        }
      }

      // 공통: 감쇠 이동(데드존 + 스텝 제한)
      const target = panTargetRef.current;
      const cur = panRef.current;
      let delta = target - cur;
      const DEADZONE = 8, ALPHA = 0.1, MAX_STEP = 40;

      if (Math.abs(delta) <= DEADZONE) {
        panRef.current = target;
      } else {
        let step = delta * ALPHA;
        if (step > MAX_STEP) step = MAX_STEP;
        if (step < -MAX_STEP) step = -MAX_STEP;
        panRef.current = cur + step;
      }

      const px = -panRef.current;
      containerRef.current?.style.setProperty('transform', `translate3d(${px}px,0,0)`);
      crowdRef.current?.style.setProperty('transform', `translate3d(${px}px,0,0)`);
      crowdStandRef.current?.style.setProperty('transform', `translate3d(${px}px,0,0)`);

      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop)
    return () => {
      mounted = false
      cancelAnimationFrame(raf)
      turtleRefs.current = []
    }
  }, [selected, finished])

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
                
                // ✅ 종료 후 이미지 변형(승/패) 적용
                const rank = finishMap.get(idx)
                const isWinner = rank === 'FIRST' || rank === 'SECOND' || rank === 'THIRD' || positionsNow[idx] > 100;
                // 기본 이미지
                let src = turtleImages[idx] ?? '/turtle-fallback.png'
                if (finished) {
                  const n = idx + 1
                  src = isWinner ? `/victory${n}.png` : `/defeat${n}.png`;
                }
                
                return (
                  /* 바깥 래퍼: X 이동만 담당 (CSS 변수로 전달) */
                  <div
                    key={idx}
                    ref={(el: HTMLDivElement | null) => {
                      turtleRefs.current[idx] = el
                    }}
                    className={`absolute z-[45] ${styles.turtleWrap} ${selected === idx ? styles.selected : ''}`}
                    style={{ top: '50%' }}
                  >
                    {/* X를 적용받는 래퍼 (transition도 여기에) */}
                    {/* <div className={`turtleWrap ${selected === idx ? 'outline outline-2 outline-yellow-400' : ''}`}> */}
                      {/* 안쪽 요소: 애니메이션은 Y만 살짝 흔들기 */}
                      <img
                        src={src}
                        alt={`turtle-${idx + 1}`}
                        // width={64}
                        // height={64}
                        className={`${styles.turtleImg} ${isRacing ? styles.racing : ''}`}
                        draggable={false}
                        onClick={() => onSelect(idx)}
                      />
                    {/* </div> */}
                  </div>
                )
              })}
          </div>
        ))}

        {/* FINISH */}
        <div
          className="absolute top-0 z-[40] flex h-full w-[38px] flex-col items-center justify-between rounded bg-[repeating-linear-gradient(90deg,#fff_0_19px,#d62c16_19px_38px)] shadow"
          style={{ left: FINISH_LINE_X - 38 }}
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
