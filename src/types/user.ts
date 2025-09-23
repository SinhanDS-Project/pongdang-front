export type UserMe = {
  id: number;
  user_name: string;
  nickname: string;
  email: string;
  birth_date: string;     // "2002-10-09"
  phone_number: string;   // "01012344567"
  profile_img: string | null;
  pong_balance: number;
  dona_balance: number;
  linked_with_betting: boolean;
};

export type UpdateUserPayload = {
  user_name?: string;
  email?: string;
  birth_date?: string;  // "2002-10-09"
  phone_number?: string;  // "01012344567"
  nickname?: string;
};

export type BettingUserInfo = {
  uid: String;
  user_name: String;
  nickname: String;
  email: String;
  phone_number: String;
  birth_date: String;
  agree_privacy: true;
  profile_img: String;
  created_at: String;
  updated_at: String;
  last_login_at: String;
  role: String;
  point_balance: number;
}