// src/lib/paste-image.ts
import { useEffect, useRef } from "react"

export type ImageFilesHandler = (files: File[]) => void

/** 클립보드 이벤트에서 이미지 파일만 추출 */
export function filesFromClipboardEvent(e: ClipboardEvent): File[] {
  const items = e.clipboardData?.items
  if (!items) return []
  const files: File[] = []
  for (const it of items) {
    if (it.kind === "file") {
      const f = it.getAsFile()
      if (f && f.type.startsWith("image/")) files.push(f)
    }
  }
  return files
}

/** 드롭 이벤트에서 이미지 파일만 추출 */
export function filesFromDropEvent(e: DragEvent): File[] {
  const dt = e.dataTransfer
  if (!dt) return []
  const files: File[] = []
  for (const f of Array.from(dt.files)) {
    if (f.type.startsWith("image/")) files.push(f)
  }
  return files
}

/**
 * 컨테이너(ref) 안에서 paste/drag&drop로 이미지 받기
 * ref가 없으면 window 전역에 붙여줄 수도 있지만, 폼마다 ref로 한정하는 걸 권장.
 */
export function useOnPastedImage(
  onImages: ImageFilesHandler,
  opts?: { ref?: React.RefObject<HTMLDivElement>; enableDrop?: boolean }
) {
  const fallbackRef = useRef<HTMLDivElement | null>(null)
  const targetRef = opts?.ref ?? fallbackRef
  const enableDrop = opts?.enableDrop ?? true

  useEffect(() => {
    const el: HTMLDivElement | Window | null =
      targetRef.current ?? (typeof window !== "undefined" ? window : null)
    if (!el) return

    const handlePaste = (e: ClipboardEvent) => {
      const imgs = filesFromClipboardEvent(e)
      if (imgs.length > 0) {
        e.preventDefault()
        onImages(imgs)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      if (!enableDrop) return
      e.preventDefault()
    }

    const handleDrop = (e: DragEvent) => {
      if (!enableDrop) return
      e.preventDefault()
      const imgs = filesFromDropEvent(e)
      if (imgs.length > 0) onImages(imgs)
    }

    // paste는 윈도우/엘리먼트 모두에 붙여도 됨
    el.addEventListener("paste", handlePaste as any)

    if (el instanceof Window) {
      if (enableDrop) {
        window.addEventListener("dragover", handleDragOver as any)
        window.addEventListener("drop", handleDrop as any)
      }
    } else {
      if (enableDrop) {
        el.addEventListener("dragover", handleDragOver as any)
        el.addEventListener("drop", handleDrop as any)
      }
    }

    return () => {
      el.removeEventListener("paste", handlePaste as any)
      if (el instanceof Window) {
        if (enableDrop) {
          window.removeEventListener("dragover", handleDragOver as any)
          window.removeEventListener("drop", handleDrop as any)
        }
      } else {
        if (enableDrop) {
          el.removeEventListener("dragover", handleDragOver as any)
          el.removeEventListener("drop", handleDrop as any)
        }
      }
    }
  }, [onImages, targetRef, enableDrop])

  return { ref: targetRef }
}

export function toPreviewURL(file: File) {
  return URL.createObjectURL(file)
}
