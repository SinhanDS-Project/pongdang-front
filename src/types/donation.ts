export type DonationItem = {
  id: number;
  amount: number;
  user_id: number;
  donation_info_id: number;
};

export type DonationPage = {
  content: DonationItem[];
  pageable: {
    page_number: number;
    page_size: number;
  };
  last: boolean;
  total_pages: number;
  total_elements: number;
  size: number;
  number: number; // 현재 페이지 (0-base)
  first: boolean;
  number_of_elements: number;
  empty: boolean;
};

export type DonationDetail = {
    id: number,
    title: String,
    purpose: String,
    content: String,
    org: String,
    start_date: Date,
    end_date: Date,
    type: String,
    goal: number,
    current: null,
    img: null
}
