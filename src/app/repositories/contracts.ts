import type {
  Auction,
  CompleteKakaoCallbackInput,
  CompleteSignupInput,
  AuthSession,
  Bid,
  CompletePaymentInput,
  CreateAuctionInput,
  KakaoCallbackResult,
  PaymentOrderSummary,
  PaymentRecord,
  PlaceBidInput,
  TokenBundle,
  UserProfile,
} from "../domain/types";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  code: string | null;
}

export interface ApiError {
  status: number;
  message: string;
  code: string | null;
}

export interface AuctionRepository {
  // 경매 목록/상세/입찰/등록과 관련된 비즈니스 기능 계약입니다.
  listAuctions(): Promise<Auction[]>;
  getAuctionById(auctionId: string): Promise<Auction | null>;
  listAuctionBids(auctionId: string): Promise<Bid[]>;
  createAuction(input: CreateAuctionInput, seller: UserProfile): Promise<Auction>;
  placeBid(input: PlaceBidInput): Promise<{ auction: Auction; bid: Bid }>;
  listAuctionsBySeller(sellerId: string): Promise<Auction[]>;
  listBiddingAuctions(bidderId: string): Promise<Auction[]>;
  listWinningAuctions(userId: string): Promise<Auction[]>;
  markAuctionPaid(auctionId: string, buyerId: string): Promise<Auction | null>;
}

export interface AuthRepository {
  // 로그인, 토큰 갱신, 세션 복구 등 인증 수명주기 계약입니다.
  getKakaoLoginUrl(): Promise<{ authorizeUrl: string; state: string }>;
  completeKakaoCallback(input: CompleteKakaoCallbackInput): Promise<KakaoCallbackResult>;
  completeSignup(input: CompleteSignupInput): Promise<TokenBundle>;
  refresh(input: { refreshToken: string }): Promise<TokenBundle>;
  logout(): Promise<void>;
  getMe(): Promise<UserProfile>;
  restoreSession(): Promise<AuthSession>;
}

export interface PaymentRepository {
  // 결제 요약 조회, 결제 완료, 내 결제내역 조회 계약입니다.
  getOrderSummary(auctionId: string): Promise<PaymentOrderSummary | null>;
  completePayment(input: CompletePaymentInput): Promise<PaymentRecord | null>;
  listPayments(userId: string): Promise<PaymentRecord[]>;
}
