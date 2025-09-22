// src/components/admin/common/PasteImageZone.tsx
"use client"
import { useRef } from "react"
import { useOnPastedImage, toPreviewURL } from "@lib/admin/paste-image"

type Props = {
  onPick: (file: File, previewUrl: string) => void
  className?: string
  children?: React.ReactNode
  hint?: string
}

export default function PasteImageZone({ onPick, className, children, hint }: Props) {
  // non-null 단언으로 HTMLDivElement ref 보장
  const boxRef = useRef<HTMLDivElement>(null!)

  useOnPastedImage(
    (files) => {
      const f = files[0]
      if (!f) return
      onPick(f, toPreviewURL(f))
    },
    { ref: boxRef, enableDrop: true }
  )

  return (
    <div
      ref={boxRef}
      className={`rounded-lg border border-dashed p-4 relative ${className ?? ""}`}
      tabIndex={0}
    >
      {children}
      <div className="absolute bottom-1 right-2 text-[11px] text-muted-foreground">
        {hint ?? "이 영역에서 이미지 붙여넣기 / 드래그 앤 드롭 가능"}
      </div>
    </div>
  )
}
