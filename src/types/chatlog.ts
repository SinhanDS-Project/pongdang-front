// types/chatlog.ts
export type ChatlogItem = {
  id: number;
  title: string;
  question: string;
  response: string | null;
  chat_date: string;        // ISO
  response_date: string | null;
  user_id: number;
  nickname: string;
};

// 우리 프로젝트에서 쓰는 표준 Page 타입
export type ChatlogPage = {
  content: ChatlogItem[];
  pageable: { page_number: number; page_size: number };
  last: boolean;
  total_pages: number;
  total_elements: number;
  size: number;
  number: number;              // 현재 페이지(0-base)
  first: boolean;
  number_of_elements: number;
  empty: boolean;
};

export type ChatlogDetail = {
  chatlog_id: number;
  title?: string;
  question?: string;
  response?: string | null;
  chat_date?: string;
  response_date?: string | null;
  user_id?: number;
  // 서버가 대화 내용을 배열로 주는 경우
  messages?: Array<{
    id?: number;
    role?: 'USER' | 'ASSISTANT' | string;
    content?: string;
    created_at?: string;
  }>;
  // 단일 본문 필드로 오는 서버를 위한 폴백
  content?: string;
  body?: string;
  detail?: string;
  message?: string;
};
