import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

type SectionTitleProps = {
  title: string
  href: string
  className?: string
}

export function SectionTitle({ title, href, className }: SectionTitleProps) {
  return (
    <Link
      href={href}
      className={cn(
        'hover:text-primary-shinhan mb-8 flex items-center text-3xl font-semibold transition-colors hover:underline',
        className,
      )}
    >
      <h3>{title}</h3>
      <ChevronRight className="ml-2 size-8" aria-hidden="true" />
    </Link>
  )
}
