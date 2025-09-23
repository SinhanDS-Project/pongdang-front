import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Player } from '@/types/pongMarble'

import { CoinsIcon, GreenTurtleIcon, OrangeTurtleIcon, PinkTurtleIcon, YellowTurtleIcon } from '@/icons'

import { Card, CardContent, CardHeader } from '@/components/ui/card'

const TurtleIconByColor: Record<string, React.ComponentType<any>> = {
  green: GreenTurtleIcon,
  yellow: YellowTurtleIcon,
  pink: PinkTurtleIcon,
  orange: OrangeTurtleIcon,
  default: GreenTurtleIcon,
}

export function PlayerCard({ player, isTurn }: { player?: Player | null; isTurn: number }) {
  if (!player) return <EmptySlotCard />

  const Icon = TurtleIconByColor[player.turtle_id] ?? TurtleIconByColor.default

  return (
    <Card
      className={cn('border-2 shadow-md transition-all', {
        'border-secondary-sky bg-secondary-light/30 ring-secondary-sky/10': isTurn === player.turn_order,
        'border-red-200 bg-red-50 opacity-50 ring-red-300': !player.active,
      })}
    >
      <CardHeader className="flex items-center gap-x-4 text-xl font-bold">
        <Icon />
        <span>{player.nickname}</span>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-end gap-x-4 text-lg font-extrabold">
          <CoinsIcon />
          <div className="text-secondary-royal">{player.balance}</div>
          <div>G</div>
        </div>
      </CardContent>
    </Card>
  )
}

export function EmptySlotCard() {
  return (
    <Card className="border-border bg-card rounded-lg border-2">
      <CardContent className="text-muted-foreground flex h-full items-center justify-center text-sm">
        <X className="h-10 w-10" />
      </CardContent>
    </Card>
  )
}
