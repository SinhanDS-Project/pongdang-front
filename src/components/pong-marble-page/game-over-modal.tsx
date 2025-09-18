"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

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

interface GameOverModalProps {
  winner: Player
  players: Player[]
  squareData: SquareData[]
}

export function GameOverModal({ winner, players, squareData }: GameOverModalProps) {
  const calculateAssets = (player: Player) => {
    const propertyValue = player.ownedProperties.reduce((sum, propIndex) => {
      return sum + squareData[propIndex].price / 2
    }, 0)
    return player.balance + propertyValue
  }

  const sortedPlayers = [...players]
    .filter((p) => !p.isEliminated)
    .sort((a, b) => calculateAssets(b) - calculateAssets(a))

  const handleRestart = () => {
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <CardTitle className="text-center text-2xl">🎉 게임 종료!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-xl font-bold mb-2">🏆 우승자: {winner.name}</div>
            <div className="text-lg text-muted-foreground">총 자산: {calculateAssets(winner)}골드</div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-center">최종 순위</h3>
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  index === 0 ? "bg-yellow-50 border-yellow-200" : "bg-muted",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold">{index + 1}위</div>
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border border-white shadow-sm",
                      player.color === "red" && "bg-red-500",
                      player.color === "blue" && "bg-blue-500",
                      player.color === "green" && "bg-green-500",
                      player.color === "yellow" && "bg-yellow-500",
                    )}
                  />
                  <div>
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-muted-foreground">
                      골드: {player.balance} | 부동산: {player.ownedProperties.length}개
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{calculateAssets(player)}골드</div>
                  <div className="text-xs text-muted-foreground">총 자산</div>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleRestart} className="w-full" size="lg">
            다시 게임하기
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
