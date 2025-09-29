import type { ReactNode } from 'react'
import GameLayout from '@/components/GameLayout'

export default function RoomLayout({ children }: { children: ReactNode }) {
  return <GameLayout>{children}</GameLayout>
}
