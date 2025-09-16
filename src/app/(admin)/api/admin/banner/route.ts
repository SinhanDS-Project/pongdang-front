import { NextRequest, NextResponse } from "next/server"
import { forwardMultipart } from "@/app/(admin)/api/_utils/forward"

export const runtime = "nodejs"

const BACKEND = process.env.API_BASE_URL // e.g. http://192.168.0.16:9090
const BANNER_INSERT_PATH = process.env.BANNER_INSERT_PATH || "/api/admin/banner"

export async function POST(req: NextRequest) {
  if (!BACKEND) {
    return NextResponse.json({ message: "API_BASE_URL not set" }, { status: 500 })
  }

  try {
    const inForm = await req.formData()

    // 1) 클라에서 온 JSON 파트/텍스트 필드 수집
    let bannerJsonText = ""
    const incomingBanner = inForm.get("banner")
    if (typeof incomingBanner === "string") {
      bannerJsonText = incomingBanner
    } else if (incomingBanner instanceof Blob) {
      bannerJsonText = await incomingBanner.text()
    }

    // (fallback) 개별 필드로도 들어왔을 수 있음
    const title = (inForm.get("title") as string) || ""
    const link  = (inForm.get("banner_link_url") as string) || ""
    const desc  = (inForm.get("description") as string) || ""

    // banner JSON이 비었으면 개별 필드로 조합
    if (!bannerJsonText || bannerJsonText.trim() === "") {
      const obj = {
        title: title || "-",
        banner_link_url: link || "-",
        description: desc || "-",
      }
      bannerJsonText = JSON.stringify(obj)
    }

    // 2) 새 FormData 구성
    const out = new FormData()

    // (가장 중요) banner 파트를 "파일명 없이" Blob으로 넣어 Content-Type 유지 + 파일 아님을 보장
    const bannerBlob = new Blob([bannerJsonText], { type: "application/json" })
    out.append("banner", bannerBlob) // <- 파일명 넣지 마세요!

    // 호환성: 혹시 서버가 평문 필드도 동시에 읽게 되어있다면 같이 넣어줌
    // (이미 banner JSON에 있지만, 중복되어도 무해)
    out.append("title", title || "-")
    out.append("banner_link_url", link || "-")
    out.append("description", desc || "-")

    // 3) 파일 파트: 서버 예제 기준 정확히 'file'
    const incomingFile = inForm.get("file") || inForm.get("image") || inForm.get("files")
    if (incomingFile instanceof Blob) {
      const f = incomingFile as File
      out.append("file", incomingFile, f.name || "banner.jpg")
    }

    // 4) 인증 전달
    const auth = req.headers.get("authorization") ?? undefined

    const resp = await fetch(`${BACKEND}${BANNER_INSERT_PATH}`, {
      method: "POST",
      headers: auth ? { Authorization: auth } : undefined,
      body: out, // ❗ 절대 Content-Type 수동 설정 금지 (boundary 자동)
    })

    const contentType = resp.headers.get("content-type") || "application/json"
    const buf = await resp.arrayBuffer()
    return new NextResponse(buf, { status: resp.status, headers: { "content-type": contentType } })
  } catch (e: any) {
    console.error("[/api/admin/banner] proxy error:", e)
    return NextResponse.json(
      { message: "proxy error", detail: e?.message ?? String(e) },
      { status: 500 }
    )
  }
}
