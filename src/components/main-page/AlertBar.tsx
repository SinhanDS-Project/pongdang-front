export function AlertBar({ message }: { message: string }) {
  return (
    <div className="shadow-badge mb-8 rounded-full px-8 py-2 text-base" role="status" aria-live="polite">
      {message}
    </div>
  )
}
