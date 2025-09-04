export function AlertBar({ message }: { message: string }) {
  return (
    <div
      className="shadow-badge mb-3 w-full rounded-full px-4 py-2 md:mb-6 md:px-8 md:text-base"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  )
}
