// src/app/api/admin/donation/route.ts
import type { NextRequest } from "next/server"

export const runtime = "nodejs"
const BACKEND = process.env.API_BASE_URL! // 예: http://192.168.0.16:9090

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? undefined
  const { search } = new URL(req.url) // ?page=...&search=...
  const res = await fetch(`${BACKEND}/api/admin/donation${search}`, {
    headers: auth ? { Authorization: auth } : undefined,
  })
  const ct = res.headers.get("content-type") ?? "application/json"
  const buf = await res.arrayBuffer()
  return new Response(buf, { status: res.status, headers: { "content-type": ct } })
}
