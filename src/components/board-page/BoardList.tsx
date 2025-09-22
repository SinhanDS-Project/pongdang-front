'use client'

import Link from 'next/link'
import type { Board } from './types'

const f = (d?: string | Date) => {
  if (!d) return '-'
  const dt = typeof d === 'string' ? new Date(d) : d
  return Number.isNaN(dt.getTime()) ? '-' : dt.toISOString().slice(0, 10)
}

export default function BoardList({ items, loading }: { items: Board[]; loading: boolean }) {
  if (loading) return <p className="py-10 text-center text-sm text-gray-500">로딩중…</p>
  if (items.length === 0) return <p className="py-10 text-center text-sm text-gray-500">게시글이 없습니다.</p>
  return (
    <ul className="space-y-2">
      {items.map((b) => (
        <li key={b.id} className="rounded border p-3">
          <Link href={`/board/${b.id}`} className="block text-center font-semibold">
            {b.title}
          </Link>
          <span className="ml-2 text-sm text-gray-500">{f(b.created_at)}</span>
          <span className="ml-2 text-sm text-gray-500">{b.nickname}</span>
        </li>
      ))}
    </ul>
  )
}
