'use client'

import { Card, CardContent } from '@/components/ui/card'

export function EmptyRoomCard() {
  return (
    <Card className="h-44 rounded-2xl border-dashed opacity-70">
      <CardContent className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">빈 슬롯</p>
      </CardContent>
    </Card>
  )
}
