export type PurchaseItem = {
  id: string;
  user_id: number;
  name: string;
  price: number;
};

export type PurchasePage = {
  content: PurchaseItem[];
  pageable: {
    page_number: number;
    page_size: number;
  };
  last: boolean;
  total_pages: number;
  total_elements: number;
  size: number;
  number: number; // 현재 페이지 (0-base)
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  }
    first: boolean;
    empty: boolean;
};
