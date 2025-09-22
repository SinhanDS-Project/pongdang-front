// src/lib/swr.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import useSWR, { SWRConfiguration, mutate } from 'swr';
import { api } from './client-axios';
import { BettingUserInfo, UserMe } from '@/types/user';
import { UpdateUserPayload } from '@/types/user';
import type { PurchasePage } from '@/types/purchase';
import type { DonationPage, DonationDetail } from "@/types/donation";
import { ChatlogDetail, ChatlogPage } from '@/types/chatlog';

/** Page 제네릭: DonationPage의 content만 제네릭으로 치환 */
export type PageRes<T> = Omit<DonationPage, "content"> & { content: T[] };

/** 서버 응답이 PageRes 형태인지 판별 */
function isPageRes<T>(v: any): v is PageRes<T> {
  return v && typeof v === "object" && Array.isArray(v.content) && "last" in v;
}

/** 기존 스타일: 단순 GET (문자열 키) */
export const axiosfetcher = (url: string) => api.get(url).then((r) => r.data);

/** 기존 스타일: 배열 키에서 params 같이 보내는 fetcher */
const fetcherWithParams = (key: readonly [string, Record<string, any>]) => {
  const [url, params] = key;
  return api.get(url, { params }).then((r) => r.data);
};

// ✅ fetcher 내부에서 분기
const fetcher = async (url: string) => {
  if (!url) return null; // null 스킵
  // 실제 API 호출
  const res = await api.get(url);
  return res.data;
};

// ✅ 기존 API 훅은 그대로 유지
// ✅ url을 string | null 로 바꾸고, null이면 요청 자체를 스킵
export const useApi = <T = unknown>(
  url: string | null,
  cfg?: SWRConfiguration<T>
) => useSWR<T>(url, fetcher, { revalidateOnFocus: false, ...cfg });

// ----------------- 내 정보 API 훅 -----------------
export function useMe() {
  return useSWR<UserMe>("/user/me", axiosfetcher, {
    revalidateOnFocus: false,
  });
}

// ----------------- 배팅 연동 API -----------------
export async function findBetting() {
  // 예: POST /api/user/link-betting  또는  /api/betting/link
  await api.get('/user/find-betting', { withCredentials: true });
  await mutate('/user/me'); // 연동 상태 갱신
}

// 배팅 연동 API (엔드포인트는 실제 서버에 맞춰 변경)
export async function linkBetting() {
  // 예: POST /api/user/link-betting  또는  /api/betting/link
  await api.put('/user/link-betting', null, { withCredentials: true });
  await mutate('/user/me'); // 연동 상태 갱신
}

// 이미 만든 BettingUserInfo 조회 훅은 enabled로 스킵 가능하게
export function useBettingUserInfo(enabled = true) {
  return useSWR<BettingUserInfo>(
    enabled ? '/user/find-betting' : null,
    axiosfetcher,
    { revalidateOnFocus: false }
  );
}

// 포인트 → 퐁 전환
const POINT_TO_PONG_PATH = '/user/betting/convert'; // 실제 경로로 교체
export async function convertPointToPong(amount: number) {
  await api.post(POINT_TO_PONG_PATH, { amount }, { withCredentials: true });
  await mutate('/user/find-betting');
  await mutate('/user/me');
}

// 전환 편의 훅: linked=false면 데이터 호출 자체를 막음
  export function usePointToPong(linked: boolean) {
  const { data, isLoading, mutate: refetch } = useBettingUserInfo(linked);
  const point_balance = Number(data?.point_balance ?? 0);

  const convert = async (amount: number) => {
    if (!linked) throw new Error('배팅 연동이 필요합니다.');
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('1 이상 숫자를 입력하세요.');
    if (amount > point_balance) throw new Error('보유 포인트를 초과했습니다.');
    await convertPointToPong(amount);
    await refetch();
  };


  return { point_balance, convert, isLoading };
}

// 닉네임 중복검사
const NICK_CHECK_PATH = '/auth/check-nickname'; // 실제 경로로 교체
export type NickCheckResult = { duplicate: boolean; message?: string };

/** 닉네임 사용 가능 여부 조회 */
export async function checkNicknameAvailability(nickname: string): Promise<NickCheckResult> {
  try {
    const { data, status } = await api.get(NICK_CHECK_PATH, { params: { nickname } });

    // 가장 흔한 응답: { duplicate: true/false, message? }
    if (data && typeof data === 'object' && 'duplicate' in data) {
      return { duplicate: !!data.duplicate, message: data.message };
    }

    // 204 No Content = 사용 가능으로 간주 (서버 설계에 따라)
    if (status === 204) return { duplicate: true };

    // 명시적 필드가 없으면 보수적으로 사용 불가 처리
    return { duplicate: false, message: '닉네임 사용 가능 여부를 확인할 수 없습니다.' };
  } catch (e: any) {
    const status = e?.response?.status;
    const msg = e?.response?.data?.message;
    // 409 등 충돌 코드는 보통 중복
    if (status === 409) return { duplicate: false, message: msg ?? '이미 사용 중입니다.' };
    if (status === 400) return { duplicate: false, message: msg ?? '잘못된 요청입니다.' };
    return { duplicate: false, message: msg ?? '중복 확인 중 오류가 발생했습니다.' };
  }
}

/** 닉네임 규칙 검사 (프로젝트 정책에 맞게 수정 가능) */
export function validateNickname(nick: string): { ok: boolean; reason?: string } {
  const n = (nick ?? '').trim();
  if (n.length < 2 || n.length > 16) return { ok: false, reason: '닉네임은 2~16자여야 합니다.' };
  return { ok: true };
}

/** 실시간(디바운스) 중복 검사 훅 */
export function useNicknameCheck(nickname: string, debounceMs = 400) {
  const [checking, setChecking] = useState(false);
  const [duplicate, setDuplicate] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const timer = useRef<any>(null);
  const lastChecked = useRef<string>('');

  const runCheck = useCallback(async (value: string) => {
    const v = value.trim();
    if (!v) {
      setDuplicate(null);
      setMessage(undefined);
      return;
    }
    setChecking(true);
    try {
      const res = await checkNicknameAvailability(v); // ✅ 정책 없이 API만 신뢰
      setDuplicate(res.duplicate);
      setMessage(res.message);
    } catch (e: any) {
      setDuplicate(false);
      setMessage(e?.response?.data?.message ?? '중복 확인 중 오류가 발생했습니다.');
    } finally {
      setChecking(false);
      lastChecked.current = v;
    }
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => runCheck(nickname ?? ''), debounceMs);
    return () => timer.current && clearTimeout(timer.current);
  }, [nickname, debounceMs, runCheck]);

  const recheck = useCallback(() => runCheck(nickname ?? ''), [nickname, runCheck]);

  return { checking, duplicate, message, recheck, lastChecked: lastChecked.current };
}

// ✅ 내 기부 내역
export function useMyDonations(page = 0, size = 10) {
  const url = "/history/donation";
  return useSWR<DonationPage>(url, axiosfetcher, { keepPreviousData: true });
}

// ✅ 내 구매 내역
export function useMyPurchases(page = 0, size = 10) {
  const url = "/history/purchase";
  return useSWR<PurchasePage>(url, axiosfetcher, { keepPreviousData: true });
}

// 공통 언래핑
const unwrap = (r: any) => r?.data?.data ?? r?.data;
// 응답을 우리 표준 ChatlogPage로 정규화
function normalizeChatlog(data: any, fallbackPage: number, fallbackSize: number): ChatlogPage {
  const logs = data?.logs ?? data;
  const content = Array.isArray(logs?.content) ? logs.content : [];
  const pageable = logs?.pageable ?? {};

  const pageNumber =
    typeof pageable.page_number === 'number'
      ? pageable.page_number
      : typeof logs?.number === 'number'
      ? logs.number
      : fallbackPage;

  const pageSize =
    typeof pageable.page_size === 'number'
      ? pageable.page_size
      : typeof logs?.size === 'number'
      ? logs.size
      : fallbackSize;

  return {
    content,
    pageable: { page_number: pageNumber, page_size: pageSize },
    last: Boolean(logs?.last),
    total_pages: Number.isFinite(logs?.total_pages) ? Number(logs.total_pages) : 1,
    total_elements: Number.isFinite(logs?.total_elements) ? Number(logs.total_elements) : content.length,
    size: pageSize,
    number: pageNumber,
    first: Boolean(logs?.first),
    number_of_elements: Number.isFinite(logs?.number_of_elements)
      ? Number(logs.number_of_elements)
      : content.length,
    // ✅ 여기가 핵심 수정
    empty: logs?.empty ?? content.length === 0,
  };
}

/** ✅ 내 문의 내역: /api/chatlog?page=1 (1-base) */
export function useMyChatlogs(page = 0, size = 10) {
  return useSWR<ChatlogPage>(
    ['/chatlog', { page, size }],
    async (key) => {
      const [url, p] = key as [string, { page: number; size: number }];

      // 1차: 1-base 시도
      try {
        const r1 = await api.get(url, { params: { page: p.page + 1, size: p.size } });
        const d1 = unwrap(r1);
        const norm1 = normalizeChatlog(d1, p.page, p.size);
        // 첫 페이지인데 비어 있고, total이 있거나 서버가 0-base일 가능성이 보이면 2차 시도
        const total = d1?.total ?? d1?.logs?.total_elements ?? norm1.total_elements;
        if (p.page === 0 && norm1.content.length === 0 && (total ?? 0) > 0) {
          // 2차: 0-base 재시도
          const r2 = await api.get(url, { params: { page: p.page, size: p.size } });
          const d2 = unwrap(r2);
          return normalizeChatlog(d2, p.page, p.size);
        }
        return norm1;
      } catch (e) {
        // 1차 자체가 실패하면 0-base로 바로 재시도
        const r2 = await api.get(url, { params: { page: p.page, size: p.size } });
        const d2 = unwrap(r2);
        return normalizeChatlog(d2, p.page, p.size);
      }
    },
    { keepPreviousData: true, revalidateOnFocus: false }
  );
}

// ✅ 내 문의 내역 상세 조회
export function useChatlogDetail(chatlog_id: number | null, cfg?: SWRConfiguration<ChatlogDetail>) {
  const url = chatlog_id ? `/chatlog/${chatlog_id}` : null;
  return useSWR<ChatlogDetail>(url, axiosfetcher, { keepPreviousData: true });
}

/** 회원정보 수정: PUT /api/user/update */
export async function updateUser(payload: UpdateUserPayload): Promise<UserMe | void> {
  const body = { ...payload, birth_date: normBirth(payload.birth_date) };
  const { data } = await api.put<UserMe | void>('/user/update', body);
  return data; // 서버가 본문을 안 주면 void
}

/** 비밀번호 변경: PUT /api/user/update  { password, new_password } */
export async function updatePassword(password: string, newPassword: string) {
  await api.put('/user/update', { password, new_password: newPassword });
  await mutate('/user/me'); // 내 정보 캐시 갱신
}

/** 닉네임 변경: PUT /api/user/update  { new_nickname } */
export async function updateNickname(newNickname: string) {
  await api.put('/user/update', { new_nickname: newNickname });
  await mutate('/user/me');
}

/** 프로필 이미지 파일명 변경: PUT /api/user/update  { profile_image } */
export async function updateProfileImage(fileName: string) {
  await api.put('/user/update', { profile_image: fileName });
  await mutate('/user/me');
}

/** 회원탈퇴 : DELETE /api/auth/unregister */
export async function withdrawUser(): Promise<void> {
  await api.delete('/auth/unregister');
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout', null, { withCredentials: true });
  } finally {
    // 캐시된 내 정보 비우기 (재로그인 전까지 게스트 상태로)
    await mutate('/user/me', null, { revalidate: false });
  }
}

function normBirth(s?: string) {
  if (!s) return s;
  const digits = s.replace(/\D/g, ''); // 숫자만
  if (digits.length === 8) {
    const y = digits.slice(0, 4);
    const m = digits.slice(4, 6);
    const d = digits.slice(6, 8);
    return `${y}-${m}-${d}`;          // "20000101" -> "2000-01-01"
  }
  // 그 외엔 점/슬래시를 하이픈으로만 통일
  return s.replace(/[./]/g, '-');
}


/** (A) 캠페인 목록 - 단일 페이지
 * GET /api/donation?page=&size= → PageRes<DonationDetail>
 */
export function useDonationInfos(
  page = 0,
  size = 12,
  cfg?: Parameters<typeof useSWR<PageRes<DonationDetail>>>[2]
) {
  return useSWR<PageRes<DonationDetail>>(
    ["/donation", { page, size }],
    (key: readonly [string, { page: number; size: number }]) => {
      const [url, params] = key;
      return api.get(url, { params }).then((r) => r.data);
    },
    { revalidateOnFocus: false, keepPreviousData: true, ...cfg }
  );
}

/** ✅ 스마트 전체 수집 훅
 * - 먼저 GET /api/donation (비페이징)을 시도 → 배열이면 그대로 사용
 * - 배열이 아니면 페이징으로 판단하고 page=0..last까지 루프 수집
 */
export function useDonationItemsAll(size = 50) {
  return useSWR<{ items: DonationDetail[]; from: "all" | "paged" }>(
    ["/donation@smart", size], // 캐시 키
    async ([, s]) => {
      // 1) 비페이징 먼저 시도
      const r0 = await api.get("/donation");
      const d0 = r0.data;
      if (Array.isArray(d0)) {
        return { items: d0 as DonationDetail[], from: "all" };
      }
      // 2) 페이징 루프 (page/size 지원 시)
      if (isPageRes<DonationDetail>(d0)) {
        let items: DonationDetail[] = [...d0.content];
        let page = 1;
        let last = d0.last === true;
        while (!last) {
          const r = await api.get<PageRes<DonationDetail>>("/donation", {
            params: { page, size: s },
          });
          items.push(...(r.data.content ?? []));
          last = r.data.last === true;
          page += 1;
        }
        return { items, from: "paged" };
      }
      // 3) 그 외 예외 형태면 빈 배열 반환
      return { items: [], from: "all" };
    },
    { revalidateOnFocus: false }
  );
}

/** (D) 캠페인 상세
 * GET /api/donation/:id → DonationDetail
 */
export function useDonationDetail(
  id: number | null,
  cfg?: Parameters<typeof useSWR<DonationDetail>>[2]
) {
  return useSWR<DonationDetail>(
    id ? `/donation/${id}` : null,
    (url: string) => api.get(url).then((r) => r.data),
    { revalidateOnFocus: false, ...cfg }
  );
}

/** (E) 기부하기(POST)
 * POST /api/donation  body: { donation_info_id:number, amount:number }
 * (SWR Mutation 없이 간단 함수로 제공)
 */
export type DonatePayload = { donation_info_id: number; amount: number, wallet_type?: 'PONG' | 'DONA' };
export function useDonate() {
  const donate = (payload: DonatePayload) =>
    api.post("/donation", payload).then((r) => r.data);
  return { donate };
}

/** (F) 기부 현황
 * GET /api/donation/status → 서버 스펙에 맞춘 타입으로 교체 가능
 */
export type DonationStatus = any; // 필요 시 구체 타입으로 교체
export function useDonationStatus(cfg?: Parameters<typeof useSWR<DonationStatus>>[2]) {
  return useSWR<DonationStatus>(
    "/donation/status",
    (url: string) => api.get(url).then((r) => r.data),
    { revalidateOnFocus: false, ...cfg }
  );
}