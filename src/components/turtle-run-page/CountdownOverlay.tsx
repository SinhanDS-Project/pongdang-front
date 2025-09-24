'use client'

export function CountdownOverlay({ count, show }: { count: number | null; show: boolean }) {
  if (!show) return null
  const label = count === 0 ? 'START!' : String(count)

  return (
    <div className="absolute pointer-events-none flex inset-0 z-50 items-center justify-center bg-black/60 backdrop-blur-sm">
      <span className="text-center text-[clamp(72px,12vmin,240px)] leading-none font-extrabold tracking-wide text-[#fffbe6] drop-shadow-[0_12px_36px_rgba(0,0,0,0.85)] select-none">
        {label}
      </span>
    </div>
  )
}
