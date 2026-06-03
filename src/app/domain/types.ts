export type PaymentMethod = "kakaopay" | "tosspay" | "card" | "bank";
export type AuthStatus = "idle" | "bootstrapping" | "authenticated" | "anonymous";
export type AuthNotice = "SESSION_EXPIRED" | "LOGIN_REQUIRED" | null;
export type AgreementTermCode = "TERMS_OF_SERVICE" | "PRIVACY_POLICY" | "MARKETING";

// 인증/사용자
export interface UserProfile {
  id: string;
  nickname: string;
  email: string;
  phone: string;
}

export interface PendingSignup {
  signupToken: string;
  email: string | null;
  nickname: string | null;
}

export interface AuthSession {
  isAuthenticated: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  authStatus: AuthStatus;
  pendingSignup: PendingSignup | null;
  authNotice: AuthNotice;
}

export interface Agreement {
  termCode: AgreementTermCode;
  isRequired: boolean;
  agreed: boolean;
}

export interface TokenBundle {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number | null;
}

export interface KakaoCallbackResult {
  requiresProfileSetup: boolean;
  signupToken: string | null;
  userId: string | null;
  email: string | null;
  nickname: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
}

export interface CompleteKakaoCallbackInput {
  code: string;
  state: string;
  redirectUri: string;
}

export interface CompleteSignupInput {
  signupToken: string;
  nickname: string;
  phone: string;
  marketingOptIn: boolean;
  agreements: Agreement[];
}

// 경매/입찰
export interface Auction {
  id: string;
  title: string;
  category: string;
  description: string;
  images: string[];
  condition: string;
  startPrice: number;
  currentBid: number;
  bidCount: number;
  buyNowPrice: number | null;
  endAt: string;
  createdAt: string;
  sellerId: string;
  sellerName: string;
  isSold: boolean;
  winnerUserId: string | null;
  highestBidderId: string | null;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  auctionId: string;
  buyerId: string;
  sellerId: string;
  method: PaymentMethod;
  amount: number;
  fee: number;
  totalAmount: number;
  status: "paid";
  createdAt: string;
}

export interface PaymentOrderSummary {
  auction: Auction;
  amount: number;
  fee: number;
  totalAmount: number;
}

export interface CreateAuctionInput {
  title: string;
  category: string;
  description: string;
  condition: string;
  startPrice: number;
  buyNowPrice: number | null;
  endDateTime: string;
  images: string[];
}

export interface PlaceBidInput {
  auctionId: string;
  amount: number;
  bidderId: string;
  bidderName: string;
}

// 결제
export interface CompletePaymentInput {
  auctionId: string;
  buyerId: string;
  method: PaymentMethod;
}

// 앱 전역 상태
export interface AppState {
  users: UserProfile[];
  session: AuthSession;
  auctions: Auction[];
  bids: Bid[];
  payments: PaymentRecord[];
  counters: {
    auction: number;
    bid: number;
    payment: number;
    user: number;
  };
}

