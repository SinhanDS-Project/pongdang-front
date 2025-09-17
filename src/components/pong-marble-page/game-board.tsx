import { cn } from '@/lib/utils'

import { GreenTurtleIcon, OrangeTurtleIcon, PinkTurtleIcon, YellowTurtleIcon } from '@/icons'

interface Player {
  id: number
  name: string
  balance: number
  position: number
  color: string
  ownedProperties: number[]
  isInJail: boolean
  jailTurns: number
  isEliminated: boolean
}

interface SquareData {
  name: string
  type: string
  price: number
}

interface GameBoardProps {
  players: Player[]
  squareData: SquareData[]
  vault: number
}

const PLAYER_ICONS: Record<number, React.ElementType> = {
  1: GreenTurtleIcon,
  2: OrangeTurtleIcon,
  3: PinkTurtleIcon,
  4: YellowTurtleIcon,
}

export function GameBoard({ players, squareData, vault }: GameBoardProps) {
  const getSquarePosition = (index: number) => {
    // 시계방향으로 24칸 배치: 출발(0,0) → 케이(0,1) → ... → 신한(1,0)
    if (index === 0) return { row: 6, col: 0 } // 출발 (좌하단)
    if (index <= 6) return { row: 6, col: index } // 하단 가로줄
    if (index <= 12) return { row: 12 - index, col: 6 } // 우측 세로줄
    if (index <= 18) return { row: 0, col: 18 - index } // 상단 가로줄 (역순)
    if (index <= 23) return { row: index - 18, col: 0 } // 좌측 세로줄
    return { row: 0, col: 0 }
  }

  const getSquareColor = (index: number) => {
    const square = squareData[index]
    const owner = players.find((p) => p.ownedProperties.includes(index))

    if (square.type === 'start' || square.type === 'jail' || square.type === 'vault' || square.type === 'travel') {
      return 'bg-purple-100 border-purple-300 text-purple-800'
    }

    if (square.type === 'quiz') {
      return 'bg-orange-100 border-orange-300 text-orange-800'
    }
    if (square.type === 'tax') {
      return 'bg-red-100 border-red-300 text-red-800'
    }
    if (square.type === 'savings') {
      return 'bg-blue-100 border-blue-300 text-blue-800'
    }

    if (owner) {
      const colorMap = {
        red: 'bg-red-200 border-red-400 text-red-900',
        blue: 'bg-blue-200 border-blue-400 text-blue-900',
        green: 'bg-green-200 border-green-400 text-green-900',
        yellow: 'bg-yellow-200 border-yellow-400 text-yellow-900',
      }
      return colorMap[owner.color as keyof typeof colorMap]
    }

    return 'bg-card border-border text-card-foreground'
  }

  const getPlayersAtPosition = (position: number) => {
    return players.filter((player) => player.position === position && !player.isEliminated)
  }

  const renderSquare = (index: number) => {
    const playersHere = getPlayersAtPosition(index)
    const square = squareData[index]

    return (
      <div
        key={index}
        className={cn(
          'relative flex aspect-square min-h-[60px] flex-col items-center justify-center rounded-lg border-2 p-1 text-xs font-medium transition-all duration-300',
          getSquareColor(index),
        )}
      >
        <div className="text-center text-[10px] leading-tight font-bold">{square.name}</div>
        {square.price > 0 && <div className="text-muted-foreground text-[8px] font-semibold">{square.price}G</div>}

        {/* 플레이어 말 */}
        {playersHere.length > 0 && (
          <div className="absolute -top-1 -left-1 flex w-24 flex-wrap gap-0.5">
            {playersHere.map((player) => {
              const Icon = PLAYER_ICONS[player.id]
              return Icon ? (
                <Icon key={player.id} className="" />
              ) : (
                <div key={player.id} className="h-3 w-3 rounded-full border-2 border-white bg-gray-400 shadow-md" />
              )
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
            <div
              key={i}
              style={{
                gridRow: pos.row + 1,
                gridColumn: pos.col + 1,
              }}
            >
              {renderSquare(i)}
            </div>
          )
        })}

        {/* 중앙 영역 */}
        <div className="border-secondary-royal bg-secondary-light col-start-2 col-end-7 row-start-2 row-end-7 flex flex-col items-center justify-center rounded-lg border-2 p-4">
          <div className="text-center">
            <div className="text-primary-shinhan mb-2 text-2xl font-bold">"암신한"님 환영합니다!</div>
            <div className="text-secondary-royal mb-4 text-sm">Pong Marble</div>
            <div className="rounded-lg border-2 border-yellow-300 bg-yellow-100 p-3 shadow-sm">
              <div className="mb-1 text-xs font-semibold text-yellow-800">💰 금고</div>
              <div className="text-xl font-bold text-yellow-900">{vault}G</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
