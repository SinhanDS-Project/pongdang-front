'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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

interface GamePanelProps {
  round: number
  dice: [number, number]
  actionLog: string[]
  players: Player[]
  currentPlayerIndex: number
  onRollDice: () => void
  canRoll: boolean
  vault: number
}

export function GamePanel({
  round,
  dice,
  actionLog,
  players,
  currentPlayerIndex,
  onRollDice,
  canRoll,
  vault,
}: GamePanelProps) {
  const formatCurrency = (amount: number) => {
    return amount + '골드'
  }

  const currentPlayer = players[currentPlayerIndex]

  return (
    <div className="space-y-4">
      {/* Round Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-lg">Round {round} / 10</CardTitle>
        </CardHeader>
      </Card>

      {/* Dice Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-center">🎲 주사위</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center gap-4">
            <div className="flex h-14 w-14 transform items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-2xl font-bold shadow-lg transition-transform hover:scale-105">
              {dice[0]}
            </div>
            <div className="flex h-14 w-14 transform items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-2xl font-bold shadow-lg transition-transform hover:scale-105">
              {dice[1]}
            </div>
          </div>
          <div className="text-muted-foreground text-center text-sm">
            합계: {dice[0] + dice[1]}칸 {dice[0] === dice[1] && '🎯 더블!'}
          </div>
          <Button
            onClick={onRollDice}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            size="lg"
            disabled={!canRoll}
          >
            {canRoll ? '🎲 주사위 굴리기' : '⏳ 대기 중...'}
          </Button>
          {currentPlayer?.isInJail && (
            <div className="rounded bg-red-50 p-2 text-center text-sm font-medium text-red-600">
              🏝️ 무인도에 갇혀있습니다 ({currentPlayer.jailTurns + 1}/2턴)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>📋 행동 로그</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {actionLog.slice(-6).map((action, index) => (
              <div
                key={index}
                className="bg-muted text-muted-foreground rounded border-l-2 border-emerald-300 p-2 text-sm"
              >
                {action}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Players Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>👥 플레이어 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={cn(
                  'rounded-lg border-2 p-3 transition-all',
                  index === currentPlayerIndex
                    ? 'border-emerald-400 bg-emerald-50 shadow-md ring-2 ring-emerald-200'
                    : 'border-border bg-card',
                  player.isEliminated && 'border-red-200 bg-red-50 opacity-50',
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border-2 border-white shadow-sm',
                      player.color === 'red' && 'bg-red-500',
                      player.color === 'blue' && 'bg-blue-500',
                      player.color === 'green' && 'bg-green-500',
                      player.color === 'yellow' && 'bg-yellow-500',
                    )}
                  />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{player.name}</span>
                  {index === currentPlayerIndex && !player.isEliminated && (
                    <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-xs font-medium text-white">현재</span>
                  )}
                  {player.isEliminated && (
                    <span className="rounded bg-red-500 px-1.5 py-0.5 text-xs font-medium text-white">💀 탈락</span>
                  )}
                </div>
                <div className="mb-1 text-xs text-gray-700 dark:text-gray-300">
                  💰 잔액: {formatCurrency(player.balance)}
                </div>
                <div className="mb-1 text-xs text-gray-700 dark:text-gray-300">
                  🏠 소유: {player.ownedProperties.length}개
                </div>
                {player.isInJail && (
                  <div className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                    🏝️ 무인도 {player.jailTurns + 1}턴
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
