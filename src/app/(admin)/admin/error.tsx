"use client";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // 관리자 권한 관련 에러 메시지 감지
  const isAuthError =
    error.message?.toLowerCase().includes("unauthorized") ||
    error.message?.toLowerCase().includes("forbidden") ||
    error.message?.toLowerCase().includes("권한");

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>
            {isAuthError ? "접근 권한이 없습니다" : "오류가 발생했습니다"}
          </CardTitle>
          <CardDescription>
            {isAuthError
              ? "관리자 권한이 필요한 페이지입니다. 메인 화면으로 이동해주세요."
              : "관리자 페이지를 불러오는 중 문제가 발생했습니다."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-center">
          {isAuthError ? (
            <Link href="/" className="block">
              <Button className="w-full">메인으로 이동</Button>
            </Link>
          ) : (
            <Button onClick={reset} className="w-full">
              다시 시도
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
