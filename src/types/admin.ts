export type Page<T> = {
  content: T[]
  pageable: {
    page_number: number
    page_size: number
    offset: number
  }
  total_pages: number
  total_elements: number
  size: number
  number: number
  last: boolean
}

export type Product = {
  id: number
  name: string
  price: number
  stock: number
  description?: string
  imageUrl?: string | null
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
  updatedAt?: string | null
}

export type Donation = {
  id: number;
  title: string;
  purpose: string;
  content: string;
  org: string;
  start_date: string; // ISO
  end_date: string;   // ISO
  type: string;
  goal: number;
  current: number | null;
  img: string | null;
};

export type Banner = {
  title: string
  image_path: string
  banner_link_url?: string | null
  description?: string
}

// --- 기존 내용 유지 ---
export type Chatlog = {
  id: number;
  title: string;
  question: string;
  response?: string | null;
  chat_date: string;
  response_date?: string | null;
  user_id: number;
  nickname?: string;
};

