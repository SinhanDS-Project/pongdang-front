"use client";

import { useEffect, useState } from "react";
import type { Chatlog } from "@/types/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/net/client-axios";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: Chatlog | null;
  onSaved?: () => void;
};

export default function AnswerDialog({ open, onOpenChange, item, onSaved }: Props) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setText(item?.response ?? "");
  }, [item]);

  const submit = async () => {
    if (!item) return;
    setSaving(true);
    try {
      await api.put(`/api/admin/chatlogs/${item.id}`, { response: text }, {
        headers: { "Content-Type": "application/json" },
      });
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? e.message ?? "저장 실패");
    } finally {
      setSaving(false);
      alert("답변이 등록되었습니다.");
      window.location.href = "/admin/chatlogs";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>답변 {item?.response ? "수정" : "작성"}</DialogTitle>
        </DialogHeader>

          <div className="text-sm text-gray-600"><b>제목</b>: {item?.title}</div>
            {/* 본문: 스크롤 가능 + 긴 문자열 줄바꿈 + 이미지 자동 리사이즈 */}
          <div className="px-5 pb-4 flex flex-col gap-3 h-[calc(100%-140px)]">
            <div className="text-sm text-muted-foreground">문의:</div>

            <div
              className="
                flex-1 rounded-md border bg-muted/30 p-3
                overflow-auto
                whitespace-pre-wrap break-words break-all
                [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md
                [&_p]:mb-2 [&_p:last-child]:mb-0
              "
              // 서버에서 온 HTML이라면 그대로 렌더 (필요시 sanitize 고려)
              dangerouslySetInnerHTML={{ __html: item?.question ?? '' }}
            />
          <Textarea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="답변을 입력하세요…"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>취소</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "저장 중…" : "저장"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
