'use client'

import Link from 'next/link'

type Props = { title: string; rows: string[][]; ctaHref: string; ctaLabel: string }

export function CtaSection({ title, rows, ctaHref, ctaLabel }: Props) {
  // bounce 타이밍 어긋나게
  const delays = [0, 0.2, 0.4, 0.6, 0.8]

  return (
    <section className="bg-bubble mb-8 flex flex-col items-center gap-y-16 py-24">
      <h2 className="text-primary-shinhan text-5xl font-extrabold">{title}</h2>

      <div className="flex flex-col items-center gap-y-8 text-3xl font-medium">
        {rows.map((row, ri) => (
          <div key={ri} className="flex flex-wrap items-center justify-center gap-x-16 gap-y-4">
            {row.map((label, i) => (
              <div
                key={label}
                className={`animate-bounce [animation-delay:${(delays[i % delays.length] + ri * 0.1).toFixed(1)}s]`}
              >
                {label}
              </div>
            ))}
          </div>
        ))}
      </div>

      <Link href={ctaHref} className="text-foreground hover:text-foreground/70 text-3xl font-bold underline">
        {ctaLabel}
      </Link>
    </section>
  )
}
