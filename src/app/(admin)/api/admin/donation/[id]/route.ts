// src/app/api/admin/donation/[id]/route.ts
import { forwardMultipart } from "../../../_utils/forward";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  // 서버 스펙이 /api/admin/donation/{infoId} 이라 했으니 동일 포워드
  return forwardMultipart(req, `/api/admin/donation/${params.id}`, "PUT");
}
