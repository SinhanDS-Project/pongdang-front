// 상품
import { forwardRaw } from "@/app/(admin)/api/_utils/forward";
export const runtime = "nodejs";
export async function POST(req: Request) {
  return forwardRaw(req, "/api/admin/product", "POST");
}