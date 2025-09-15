// src/lib/multipart.ts
/**
 * 멀티파트 폼데이터에 JSON 파트(여러 이름) + 동일 필드의 텍스트 파트(중복) + 파일(여러 키)을 넣어
 * 서버 호환성을 극대화합니다.
 */
export function buildMultipart(
  json: Record<string, any>,
  file: File | null,
  opts: {
    jsonPartNames: string[];         // 예: ["product"], ["banner"], ["donation", "info"]
    fileFieldNames?: string[];       // 기본: ["files","file","image","img"]
    coerceEmptyTo?: string;          // 빈 문자열 방지 기본값(예: "-")
  }
) {
  const fd = new FormData();

  // 1) JSON 파트들
  const jsonBlob = new Blob([JSON.stringify(json)], { type: "application/json" });
  for (const part of opts.jsonPartNames) {
    fd.append(part, jsonBlob, `${part}.json`);
  }

  // 2) 개별 텍스트 필드(서버가 @RequestParam으로 받을 때 대비)
  const coerce = opts.coerceEmptyTo ?? "";
  for (const [k, v] of Object.entries(json)) {
    if (v === null || v === undefined) {
      fd.append(k, coerce);
    } else if (typeof v === "object") {
      // 객체/배열은 문자열화
      fd.append(k, JSON.stringify(v));
    } else {
      fd.append(k, String(v));
    }
  }

  // 3) 파일 파트(여러 키로 중복)
  const fileKeys = opts.fileFieldNames ?? ["files", "file", "image", "img"];
  if (file) {
    for (const key of fileKeys) {
      fd.append(key, file, file.name);
    }
  }

  return fd;
}

/** null/빈값 방지를 위해 문자열 필드에 기본값을 깔끔히 적용 */
export function sanitizeString(v: any, fallback = "-") {
  const s = (v ?? "").toString().trim();
  return s.length ? s : fallback;
}
