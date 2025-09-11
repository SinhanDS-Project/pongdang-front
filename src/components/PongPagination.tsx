'use client'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type SimplePaginationProps = {
  /** 1-based */
  page: number
  totalPages: number
  onChange?: (page: number) => void
  /** 링크 모드로 쓰고 싶을 때: 해당 페이지의 href 생성기 */
  hrefBuilder?: (page: number) => string
  disabled?: boolean
  /** 데스크톱에서 보여줄 페이지 숫자 갯수(현재 기준 양 옆 한칸씩 = 1) */
  siblingCount?: number
  className?: string
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function buildPages(current: number, total: number, siblingCount: number) {
  if (total <= 1) return [1]
  const start = Math.max(1, current - siblingCount)
  const end = Math.min(total, current + siblingCount)
  const arr = range(start, end)
  // 양 끝과의 간격에 따라 Ellipsis 추가
  const out: (number | 'dots')[] = []
  if (start > 1) {
    out.push(1)
    if (start > 2) out.push('dots')
  }
  out.push(...arr)
  if (end < total) {
    if (end < total - 1) out.push('dots')
    out.push(total)
  }
  return out
}

export function PongPagination({
  page,
  totalPages,
  onChange,
  hrefBuilder,
  disabled,
  siblingCount = 1,
  className,
}: SimplePaginationProps) {
  if (totalPages <= 1) return null

  const isLink = typeof hrefBuilder === 'function'
  const prev = page - 1
  const next = page + 1
  const pages = buildPages(page, totalPages, siblingCount)

  const go = (p: number) => {
    if (disabled) return
    if (p < 1 || p > totalPages || p === page) return
    onChange?.(p)
  }

  const Btn = ({ label, target, ariaLabel }: { label: string; target: number; ariaLabel: string }) => {
    const isDisabled = disabled || target < 1 || target > totalPages || target === page
    if (isLink) {
      return (
        <PaginationItem>
          <PaginationLink
            className={cn('px-3', isDisabled && 'pointer-events-none opacity-60')}
            aria-disabled={isDisabled}
          >
            <Link href={isDisabled ? '#' : hrefBuilder!(target)} aria-label={ariaLabel} prefetch={false}>
              {label}
            </Link>
          </PaginationLink>
        </PaginationItem>
      )
    }
    return (
      <PaginationItem>
        <PaginationLink
          onClick={() => go(target)}
          aria-label={ariaLabel}
          className={cn('px-3', isDisabled && 'pointer-events-none opacity-60')}
          aria-disabled={isDisabled}
        >
          {label}
        </PaginationLink>
      </PaginationItem>
    )
  }

  const Num = ({ p }: { p: number }) => {
    const active = p === page
    if (isLink) {
      return (
        <PaginationItem className="hidden md:list-item">
          <PaginationLink isActive={active} aria-current={active ? 'page' : undefined}>
            <Link href={hrefBuilder!(p)} prefetch={false} aria-label={`${p}페이지로 이동`}>
              {p}
            </Link>
          </PaginationLink>
        </PaginationItem>
      )
    }
    return (
      <PaginationItem className="hidden md:list-item">
        <PaginationLink onClick={() => go(p)} isActive={active} aria-current={active ? 'page' : undefined}>
          {p}
        </PaginationLink>
      </PaginationItem>
    )
  }

  return (
    <Pagination className={className}>
      <PaginationContent>
        <Btn label="‹ 이전" target={prev} ariaLabel="이전 페이지로 이동" />

        {/* 모바일: 페이지 요약 텍스트 */}
        <PaginationItem className="md:hidden">
          <span className="text-muted-foreground mx-2 text-sm select-none">
            {page} / {totalPages}
          </span>
        </PaginationItem>

        {/* 데스크톱: 숫자 + Ellipsis */}
        {pages.map((it, i) =>
          it === 'dots' ? (
            <PaginationItem className="hidden md:list-item" key={`dots-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <Num key={it} p={it} />
          ),
        )}

        <Btn label="다음 ›" target={next} ariaLabel="다음 페이지로 이동" />
      </PaginationContent>
    </Pagination>
  )
}
