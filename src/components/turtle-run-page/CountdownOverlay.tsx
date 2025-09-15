'use client'

export function CountdownOverlay({ count, show }: { count: number | null; show: boolean }) {
  if (!show) return null
  const label = count === 0 ? 'START!' : String(count)

  return (
    <div className="align-center pointer-events-none fixed inset-0 top-1/3 left-1/2 z-50 -translate-x-1/2 -translate-y-1/3 place-items-center justify-center bg-black/60 backdrop-blur-sm">
      <span className="align-center flex place-items-center justify-center text-center text-[clamp(72px,12vmin,240px)] leading-none font-extrabold tracking-wide text-[#fffbe6] drop-shadow-[0_12px_36px_rgba(0,0,0,0.85)] select-none">
        {label}
      </span>
    </div>
  )
}
