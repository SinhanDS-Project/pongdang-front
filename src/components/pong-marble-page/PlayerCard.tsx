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
      className={cn('md:py-6" gap-1 rounded border py-1 shadow-md transition-all md:gap-6 md:rounded-lg md:border-2', {
        'border-secondary-sky bg-secondary-light/30 ring-secondary-sky/10': isTurn === player.turn_order,
        'border-red-200 bg-red-50 opacity-50 ring-red-300': !player.active,
      })}
    >
      <CardHeader className="relative flex items-center px-0 md:block md:gap-x-4 md:px-6 md:text-xl">
        <div className="absolute -translate-1/3 md:block">
          <Icon />
        </div>
        <span className="w-full text-center text-xs font-bold md:text-start md:text-xl">{player.nickname}</span>
      </CardHeader>
      <CardContent className="grow px-2 md:px-6">
        <div className="flex items-center justify-between gap-x-2 text-base font-extrabold md:justify-end md:gap-x-4 md:text-lg">
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
    <Card className="border-border bg-card rounded border py-2 md:rounded-lg md:border-2 md:py-6">
      <CardContent className="text-muted-foreground flex h-full items-center justify-center">
        <X className="md:h-10 md:w-10" />
      </CardContent>
    </Card>
  )
}
