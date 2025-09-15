"use client";

import { useEffect, useState } from "react";
import { inquiriesApi } from "@/lib/admin/chatlogs";
import type { Chatlog } from "@/types/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
      await inquiriesApi.answer(item.id, text);
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? e.message ?? "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>답변 {item?.response ? "수정" : "작성"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm text-gray-600"><b>제목</b>: {item?.title}</div>
          <div className="text-sm text-gray-600"><b>문의</b>: {item?.question}</div>
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
