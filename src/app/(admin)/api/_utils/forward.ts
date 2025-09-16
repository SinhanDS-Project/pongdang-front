export const runtime = "nodejs"; // 파일/스트림 전송은 node 런타임이 안전

const BACKEND = process.env.API_BASE_URL;

/** JSON 본문을 그대로 백엔드로 포워딩 */
export async function forwardJson(
  req: Request,
  path: string,
  method: "POST" | "PUT" | "PATCH"
) {
  try {
    const raw = await req.text(); // body 그대로

    const headers: HeadersInit = {
      "content-type": "application/json",
    };
    const auth = req.headers.get("authorization");
    if (auth) headers["authorization"] = auth;

    const res = await fetch(`${BACKEND}${path}`, {
      method,
      headers,
      body: raw,
    });

    const contentType = res.headers.get("content-type") || "";
    const status = res.status;

    if (contentType.includes("application/json")) {
      const data = await res.json();
      return Response.json(data, { status });
    } else {
      const buf = await res.arrayBuffer();
      return new Response(buf, {
        status,
        headers: { "content-type": contentType || "text/plain" },
      });
    }
  } catch (e: any) {
    return Response.json(
      { message: "proxy error", detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

/** (기존 그대로) 들어온 FormData를 새 FormData로 복사해서 백엔드로 포워딩 */
export async function forwardMultipart(
  req: Request,
  path: string,
  method: "POST" | "PUT"
) {
  try {
    const inForm = await req.formData();

    const outForm = new FormData();
    for (const [key, val] of inForm.entries()) {
      if (val instanceof File) {
        outForm.append(key, val, (val as any).name ?? "upload.bin");
      } else {
        outForm.append(key, val as string);
      }
    }

    const headers: HeadersInit = {};
    const auth = req.headers.get("authorization");
    if (auth) headers["authorization"] = auth;

    const res = await fetch(`${BACKEND}${path}`, {
      method,
      headers,
      body: outForm, // Content-Type 자동 세팅
    });

    const contentType = res.headers.get("content-type") || "";
    const status = res.status;

    if (contentType.includes("application/json")) {
      const data = await res.json();
      return Response.json(data, { status });
    } else {
      const text = await res.text();
      return new Response(text, { status });
    }
  } catch (e: any) {
    return Response.json(
      { message: "proxy error", detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

export async function forwardRaw(
  req: Request,
  path: string,
  method: "POST" | "PUT"
) {
  // 1) 원본 헤더 복사 (host/length 제거)
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  // 2) Content-Type 보정 (multipart에 붙는 ;charset=… 제거)
  const ct = req.headers.get("content-type") || "";
  if (ct.toLowerCase().startsWith("multipart/form-data")) {
    headers.set("content-type", ct.replace(/; *charset=[^;]+/i, ""));
  }

  // 3) 바디를 원바이트 그대로 읽어서 전달 (스트림 재조립 금지)
  const body = await req.arrayBuffer();

  const res = await fetch(`${BACKEND}${path}`, {
    method,
    headers,
    body, // Buffer/ArrayBuffer 그대로
    // ⚠ fetch에 duplex 주지 않아도 Buffer라 OK
  });

  // 4) 응답 그대로 반환
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const buf = await res.arrayBuffer();
  return new Response(buf, { status: res.status, headers: { "content-type": contentType } });
}