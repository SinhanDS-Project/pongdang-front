import { cn } from '@/lib/utils'

import { CoinsIcon, GreenTurtleIcon, OrangeTurtleIcon, PinkTurtleIcon, YellowTurtleIcon } from '@/icons'
import { Land } from '@/types/pongMarble'

interface Player {
  id: number
  nickname: string
  balance: number
  position: number
  turtle_id: string
}

interface GameBoardProps {
  players: Player[]
  lands: Land[]
  vault: number
  message?: string
}

const ICON_BY_COLOR: Record<string, React.ElementType> = {
  green: GreenTurtleIcon,
  yellow: YellowTurtleIcon,
  pink: PinkTurtleIcon,
  orange: OrangeTurtleIcon,
  default: GreenTurtleIcon,
}

export function GameBoard({ players, lands, vault, message }: GameBoardProps) {
  // 7x7 그리드 (0..6), 출발을 오른쪽 하단(6,6)에 두고 왼쪽→위→오른쪽→아래로 반시계 진행
  const getSquarePosition = (index: number) => {
    // 0: (6,6)
    if (index === 0) return { row: 6, col: 6 }

    // 1..6: 하단 가로줄을 왼쪽으로 (col: 5..0, row: 6)
    if (index <= 6) return { row: 6, col: 6 - index }

    // 7..12: 좌측 세로줄을 위로 (row: 5..0, col: 0)
    if (index <= 12) return { row: 12 - index, col: 0 }

    // 13..18: 상단 가로줄을 오른쪽으로 (col: 1..6, row: 0)
    if (index <= 18) return { row: 0, col: index - 12 }

    // 19..23: 우측 세로줄을 아래로 (row: 1..5, col: 6)
    if (index <= 23) return { row: index - 18, col: 6 }

    return { row: 0, col: 0 }
  }

  // 소유자 → 플레이어 색상으로 타일 컬러 지정
  const getSquareColor = (index: number) => {
    const land = lands[index]
    // 타입 정보가 없으면 landId === 0만 'start' 취급, 나머지는 property
    if (!land) return 'bg-card border-border text-card-foreground'

    if (land.land_id === 0) {
      return 'bg-neutral-100 border-neutral-300 text-neutral-800'
    }

    if (land.land_id === 3 || land.land_id === 10) {
      return 'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800'
    }

    if (land.land_id === 6) {
      return 'bg-slate-100 border-slate-300 text-slate-800'
    }

    if (land.land_id === 12) {
      return 'bg-amber-100 border-amber-300 text-amber-800'
    }

    if (land.land_id === 15) {
      return 'bg-rose-100 border-rose-300 text-rose-800'
    }

    if (land.land_id === 18) {
      return 'bg-teal-100 border-teal-300 text-teal-800'
    }

    if (land.land_id === 22) {
      return 'bg-red-100 border-red-300 text-red-800'
    }

    // 주인이 있으면 그 플레이어의 color로 색상 지정
    if (land.owner_id != null) {
      const owner = players.find((p) => p.id === land.owner_id)

      if (owner) {
        const colorMap: Record<string, string> = {
          orange: 'bg-orange-200 border-orange-400 text-orange-900',
          green: 'bg-green-200 border-green-400 text-green-900',
          yellow: 'bg-yellow-200 border-yellow-400 text-yellow-900',
          pink: 'bg-pink-200 border-pink-400 text-pink-900',
        }
        return colorMap[owner.turtle_id] ?? 'bg-card border-border text-card-foreground'
      }
    }

    // 기본(무소유)
    return 'bg-card border-border text-card-foreground'
  }

  const getPlayersAtPosition = (position: number) => {
    return players.filter((player) => player.position === position)
  }

  const renderSquare = (index: number) => {
    const land = lands[index]
    const playersHere = getPlayersAtPosition(index)

    return (
      <div
        key={index}
        className={cn(
          'relative flex aspect-square min-h-[60px] flex-col items-center justify-center rounded-lg border-2 p-1 text-xs font-medium transition-all duration-300',
          getSquareColor(index),
        )}
      >
        <div className="text-center text-[10px] leading-tight font-bold">{land?.name ?? `칸 ${index}`}</div>
        {land &&
          land.price > 0 &&
          (land.owner_id == null ? (
            <div className="text-muted-foreground text-[8px] font-semibold">{land.price}G</div>
          ) : (
            <div className="text-[8px] font-semibold">{land.toll}G</div>
          ))}
        {/* 플레이어 말 */}
        {playersHere.length > 0 && (
          <div className="absolute -top-1 -left-1 flex w-32 flex-wrap gap-0.5">
            {playersHere.map((player) => {
              const Icon = ICON_BY_COLOR[player.turtle_id] ?? ICON_BY_COLOR.default
              return <Icon key={player.id} />
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex aspect-square grow items-center justify-center rounded-xl">
      <div className="mx-auto grid aspect-square w-full max-w-2xl grid-cols-7 grid-rows-7 gap-1">
        {Array.from({ length: 24 }, (_, i) => {
          const pos = getSquarePosition(i)
          return (
            <div key={i} style={{ gridRow: pos.row + 1, gridColumn: pos.col + 1 }}>
              {renderSquare(i)}
            </div>
          )
        })}

        {/* 중앙 영역 */}
        <div className="col-start-2 col-end-7 row-start-2 row-end-7 flex flex-col items-center justify-center rounded-lg border-2 border-slate-400 bg-slate-200 p-4">
          <div className="flex flex-col items-center justify-center gap-y-4">
            <div className="mb-2 text-xl font-bold text-indigo-500">
              "{message || '퐁마블 게임에 오신 것을 환영합니다!!'}"
            </div>
            <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-sky-500 bg-sky-100 p-3">
              <div className="text-base font-bold text-blue-700">금고에 모인 금액</div>
              <div className="flex gap-x-4 text-xl font-bold text-yellow-900">
                <CoinsIcon />
                <div className="w-20 items-center text-center">{vault}</div>
                <div>G</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
