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
  UpdateAuctionInput,
  UserProfile,
} from "../domain/types";

/** 서버 공통 응답 래퍼 (백엔드 ApiResponse와 동일 구조) */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  code: string | null;
}

/** fetch 실패 시 throw되는 에러 객체 형태 */
export interface ApiError {
  status: number;   // HTTP 상태 코드
  message: string;
  code: string | null; // 서버 에러 코드 (예: "UNAUTHORIZED")
}

/**
 * 경매 저장소 계약.
 * mock/http 구현체가 이 인터페이스를 구현하며, index.ts에서 합성해 사용합니다.
 */
export interface AuctionRepository {
  listAuctions(): Promise<Auction[]>;                                         // 공개 경매 목록
  getAuctionById(auctionId: string): Promise<Auction | null>;                 // 경매 단건 상세
  listAuctionBids(auctionId: string): Promise<Bid[]>;                         // 경매 입찰 내역
  createAuction(input: CreateAuctionInput, seller: UserProfile): Promise<Auction>;
  updateAuction(auctionId: string, input: UpdateAuctionInput): Promise<Auction>;
  deleteAuction(auctionId: string): Promise<void>;
  placeBid(input: PlaceBidInput): Promise<{ auction: Auction; bid: Bid }>;    // 입찰 (경매 상태도 갱신)
  listAuctionsBySeller(sellerId: string): Promise<Auction[]>;                 // 내가 판매 중인 경매
  listBiddingAuctions(bidderId: string): Promise<Auction[]>;                  // 내가 입찰 중인 경매
  listWinningAuctions(userId: string): Promise<Auction[]>;                    // 낙찰된 경매
  markAuctionPaid(auctionId: string, buyerId: string): Promise<Auction | null>; // 결제 완료 표시
}

/**
 * 인증 저장소 계약.
 * 카카오 OAuth 전체 흐름 + 세션 수명주기를 담당합니다.
 */
export interface AuthRepository {
  getKakaoLoginUrl(): Promise<{ authorizeUrl: string; state: string }>; // 1) 로그인 URL 발급
  completeKakaoCallback(input: CompleteKakaoCallbackInput): Promise<KakaoCallbackResult>; // 2) 콜백 처리
  completeSignup(input: CompleteSignupInput): Promise<TokenBundle>;     // 3) 추가 정보 입력 완료
  refresh(input: { refreshToken: string }): Promise<TokenBundle>;       // 토큰 재발급
  logout(): Promise<void>;
  getMe(): Promise<UserProfile>;            // 내 정보 조회
  restoreSession(): Promise<AuthSession>;   // 앱 시작 시 저장된 refresh 토큰으로 세션 복구
}

/**
 * 결제 저장소 계약.
 * 현재 mock 구현만 있으며 토스페이먼츠 연동 시 http 구현으로 전환 예정.
 */
export interface PaymentRepository {
  getOrderSummary(auctionId: string): Promise<PaymentOrderSummary | null>; // 결제 전 주문 요약
  completePayment(input: CompletePaymentInput): Promise<PaymentRecord | null>; // 결제 완료 처리
  listPayments(userId: string): Promise<PaymentRecord[]>;                    // 내 결제 내역
}
