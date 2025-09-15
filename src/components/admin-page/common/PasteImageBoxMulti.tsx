// src/components/admin/common/PasteImageBoxMulti.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@components/ui/input"
import { Button } from "@components/ui/button"
import { Label } from "@components/ui/label"
import { Upload, X } from "lucide-react"
import clsx from "clsx"
import { useOnPastedImage, toPreviewURL } from "@/lib/admin/paste-image"

type Props = {
  label?: string
  hint?: string
  files: File[]
  setFiles: (fs: File[]) => void
  maxCount?: number // 기본 2
  enableDrop?: boolean
  containerRef?: React.RefObject<HTMLElement | null>
}

export function PasteImageBoxMulti({
  label = "이미지",
  hint = "여기에 붙여넣기/드래그 또는 파일 선택 (최대 2장: ① 설명, ② 대표)",
  files,
  setFiles,
  maxCount = 2,
  enableDrop = true,
  containerRef,
}: Props) {
  const divRef = useRef<HTMLDivElement>(null!)
  const targetRef = useRef<HTMLElement | null>(null)
  const [previews, setPreviews] = useState<string[]>([])

  useEffect(() => {
    targetRef.current = containerRef?.current ?? divRef.current
  }, [containerRef])

  // 붙여넣기/드롭 -> 순서 그대로 추가
  useOnPastedImage(
    (pasted) => {
      if (!pasted.length) return
      const remain = Math.max(0, maxCount - files.length)
      if (remain <= 0) return
      setFiles([...files, ...pasted.slice(0, remain)])
    },
    { ref: targetRef, enableDrop }
  )

  // 파일 선택
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : []
    if (!list.length) return
    const remain = Math.max(0, maxCount - files.length)
    if (remain <= 0) return
    setFiles([...files, ...list.slice(0, remain)])
  }

  // 미리보기 URL 관리
  useEffect(() => {
    previews.forEach((p) => p.startsWith("blob:") && URL.revokeObjectURL(p))
    const urls = files.map((f) => toPreviewURL(f))
    setPreviews(urls)
    return () => {
      urls.forEach((u) => u.startsWith("blob:") && URL.revokeObjectURL(u))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files])

  const removeAt = (i: number) => {
    const next = files.slice()
    next.splice(i, 1)
    setFiles(next)
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        ref={divRef}
        className={clsx(
          "relative border rounded-md p-4 transition-colors",
          "bg-muted/30 hover:bg-muted/50",
          "border-dashed"
        )}
      >
        {files.length === 0 && (
          <div className="text-sm text-muted-foreground mb-3">{hint}</div>
        )}

        {previews.length > 0 && (
          <div className="mb-3 grid grid-cols-2 gap-3 max-h-60 overflow-auto p-1 rounded border bg-background">
            {previews.map((src, idx) => (
              <div key={idx} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`preview-${idx + 1}`} className="block w-full h-32 object-contain rounded border" />
                <div className="absolute top-1 left-1 text-xs bg-black/60 text-white px-1 rounded">
                  {idx === 0 ? "① 설명용" : idx === 1 ? "② 대표" : idx + 1}
                </div>
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded-full p-1"
                  onClick={() => removeAt(idx)}
                  aria-label="remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Input type="file" accept="image/*" multiple onChange={onPick} className="max-w-xs" />
          <Upload className="h-4 w-4 text-muted-foreground" />
          {files.length > 0 && (
            <Button type="button" variant="outline" onClick={() => setFiles([])}>
              모두 지우기
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
