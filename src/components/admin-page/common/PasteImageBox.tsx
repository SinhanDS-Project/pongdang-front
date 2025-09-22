// src/components/admin-page/common/PasteImageBox.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useOnPastedImage, toPreviewURL } from "@lib/admin/paste-image"
import { Label } from "@components/ui/label"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Textarea } from "@components/ui/textarea"
import { Upload } from "lucide-react"
import clsx from "clsx"

type Props = {
  label?: string
  hint?: string
  file: File | null
  setFile: (f: File | null) => void
  initialUrl?: string | null
  enableDrop?: boolean
  /** 외부에서 이벤트 타깃을 지정하고 싶을 때 (없으면 내부 div 사용) */
  containerRef?: React.RefObject<HTMLDivElement>

  // 텍스트도 받기
  acceptText?: boolean
  text?: string
  setText?: (v: string) => void
  onTextPaste?: (t: string) => void

  maxSizeMB?: number
  acceptMime?: string[]
  onFileRejected?: (reason: string) => void
}

export function PasteImageBox({
  label = "이미지 / 텍스트",
  hint = "여기에 붙여넣기(Ctrl/⌘+V) 또는 드래그&드롭 / 우측 버튼으로 파일 선택",
  file,
  setFile,
  initialUrl = null,
  enableDrop = true,
  containerRef,
  acceptText = true,
  text,
  setText,
  onTextPaste,
  maxSizeMB = 10,
  acceptMime,
  onFileRejected,
}: Props) {
  // JSX에 꽂는 ref는 HTMLDivElement로 고정 (non-null 단언)
  const divRef = useRef<HTMLDivElement>(null!)
  // 이벤트 타깃은 HTMLElement | null 로 두고, 외부/내부 중 하나를 사용
  const targetRef = useRef<HTMLDivElement>(null)

  const [preview, setPreview] = useState<string | null>(initialUrl)

  useEffect(() => {
    targetRef.current = containerRef?.current ?? divRef.current
  }, [containerRef])

  // 이미지 붙여넣기/드롭
  useOnPastedImage(
    (files) => {
      const f = files[0]
      if (!f) return
      const okType = acceptMime ? acceptMime.includes(f.type) : f.type.startsWith("image/")
      if (!okType) return onFileRejected?.("허용되지 않는 파일 형식입니다.")
      if (f.size > maxSizeMB * 1024 * 1024) return onFileRejected?.(`파일 크기가 ${maxSizeMB}MB를 초과합니다.`)

      setFile(f)
      setPreview((old) => {
        if (old && old.startsWith("blob:")) URL.revokeObjectURL(old)
        return toPreviewURL(f)
      })
    },
    { ref: targetRef, enableDrop }
  )

  // initialUrl 반영
  useEffect(() => {
    if (!file) setPreview(initialUrl ?? null)
  }, [initialUrl, file])

  // 파일 선택
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const okType = acceptMime ? acceptMime.includes(f.type) : f.type.startsWith("image/")
    if (!okType) return onFileRejected?.("허용되지 않는 파일 형식입니다.")
    if (f.size > maxSizeMB * 1024 * 1024) return onFileRejected?.(`파일 크기가 ${maxSizeMB}MB를 초과합니다.`)

    setFile(f)
    setPreview((old) => {
      if (old && old.startsWith("blob:")) URL.revokeObjectURL(old)
      return toPreviewURL(f)
    })
  }

  // 텍스트 붙여넣기: div에 직접 onPaste + window 백업
  const handleTextPasteReact = (e: React.ClipboardEvent) => {
    if (!acceptText) return
    const hasImage = Array.from(e.clipboardData?.items || []).some(
      (it) => it.kind === "file" && it.type.startsWith("image/")
    )
    if (hasImage) return

    const t = e.clipboardData?.getData("text/plain")?.trim()
    if (!t) return
    e.preventDefault()
    setText?.(t)
    onTextPaste?.(t)
  }

  useEffect(() => {
    if (!acceptText) return
    const handler = (e: ClipboardEvent) => {
      const hasImage =
        !!e.clipboardData &&
        Array.from(e.clipboardData.items || []).some(
          (it) => it.kind === "file" && it.type.startsWith("image/")
        )
      if (hasImage) return

      const t = e.clipboardData?.getData("text/plain")?.trim()
      if (!t) return

      const el = divRef.current
      const isFocused = document.activeElement === el
      const isHover = el.matches(":hover")
      if (isFocused || isHover) {
        e.preventDefault()
        setText?.(t)
        onTextPaste?.(t)
      }
    }
    window.addEventListener("paste", handler)
    return () => window.removeEventListener("paste", handler)
  }, [acceptText, onTextPaste, setText])

  const clearImage = () => {
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
  }
  const clearText = () => {
    setText?.("")
    onTextPaste?.("")
  }

  const hasImage = useMemo(() => !!(file || (preview && preview.length > 0)), [file, preview])
  const hasText = useMemo(() => !!(text && text.length > 0), [text])

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        ref={divRef}
        tabIndex={0}
        onPaste={handleTextPasteReact}
        className={clsx(
          "relative border rounded-md p-4 transition-colors",
          "bg-muted/30 hover:bg-muted/50",
          "border-dashed outline-none focus:ring-2 focus:ring-ring"
        )}
      >
        {!hasImage && !hasText && (
          <div className="text-sm text-muted-foreground mb-3">{hint}</div>
        )}

        {preview && (
          <div className="mb-3 max-h-60 overflow-auto rounded-md border bg-background p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="preview" className="block max-h-56 rounded" />
          </div>
        )}

        <div className="flex items-center gap-3">
          <Input type="file" accept="image/*" onChange={onPick} className="max-w-xs" />
          <Upload className="h-4 w-4 text-muted-foreground" />
          {hasImage && (
            <Button type="button" variant="outline" onClick={clearImage}>
              이미지 지우기
            </Button>
          )}
          {acceptText && hasText && (
            <Button type="button" variant="outline" onClick={clearText}>
              텍스트 지우기
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
