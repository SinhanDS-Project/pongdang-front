'use client'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useEffect, useState, type ReactNode } from 'react'

export default function GameView({ children }: { children: ReactNode }) {
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia?.('(orientation: portrait)')
    const update = () => setIsPortrait(mql ? mql.matches : window.innerHeight > window.innerWidth)
    update()

    if (mql?.addEventListener) {
      mql.addEventListener('change', update)
      return () => mql.removeEventListener('change', update)
    } else {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <>
      {/* 실제 컨텐츠는 항상 렌더링(레이아웃 영향 X) */}
      {children}

      {/* 세로모드일 때만 안내 다이얼로그 오픈 */}
      <AlertDialog
        open={isPortrait}
        // 사용자가 ESC/바깥 클릭으로 닫아도, 상태는 방향에 의해 결정되므로 무시
        onOpenChange={() => {
          /* orientation으로만 제어 */
        }}
      >
        <AlertDialogContent className="max-w-sm sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>가로 모드로 전환해주세요</AlertDialogTitle>
            <AlertDialogDescription>
              모바일에서 더 좋은 경험을 위해 가로 모드가 필요해요.
              <br />
              기기를 회전하거나 자동 회전을 켠 뒤 다시 시도해주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* 버튼은 굳이 넣지 않습니다. (가로로 전환되면 자동으로 닫히게) */}
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
