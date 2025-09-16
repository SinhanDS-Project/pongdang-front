"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PurchaseModalProps {
  squareName: string
  price: number
  playerBalance: number
  onPurchase: () => void
  onCancel: () => void
}

export function PurchaseModal({ squareName, price, playerBalance, onPurchase, onCancel }: PurchaseModalProps) {
  const canAfford = playerBalance >= price

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-center">🏢 부동산 구매</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-xl font-bold mb-2">{squareName}</div>
            <div className="text-lg text-muted-foreground mb-4">가격: {price}골드</div>
            <div className="text-sm">현재 잔액: {playerBalance}골드</div>
            <div className="text-sm text-muted-foreground">구매 후 잔액: {playerBalance - price}골드</div>
          </div>

          {!canAfford && <div className="text-center text-red-600 font-medium">잔액이 부족합니다!</div>}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={onCancel}>
              취소
            </Button>
            <Button className="flex-1" onClick={onPurchase} disabled={!canAfford}>
              구매하기
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">통행료: {price * 2}골드</div>
        </CardContent>
      </Card>
    </div>
  )
}
