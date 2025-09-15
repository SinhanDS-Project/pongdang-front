import { forwardJson, forwardMultipart } from "@/app/(admin)/api/_utils/forward";

export const runtime = "nodejs";

// 생성
export async function POST(req: Request) {
  const ct = req.headers.get("content-type") || "";
  // 서버가 현재 JSON만 지원하므로 JSON은 그대로 통과
  if (ct.includes("application/json")) {
    return forwardJson(req, "/api/admin/product", "POST");
  }
  // 혹시 나중에 멀티파트 허용되면 여기서도 통과 가능
  return forwardMultipart(req, "/api/admin/product", "POST");
}