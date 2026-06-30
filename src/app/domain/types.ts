// 결제 수단 유니온 타입
export type PaymentMethod = "kakaopay" | "tosspay" | "card" | "bank";

// 인증 상태 머신 값
// idle: 앱 첫 진입, bootstrapping: 세션 복구 중, authenticated: 로그인 완료, anonymous: 비로그인
export type AuthStatus = "idle" | "bootstrapping" | "authenticated" | "anonymous";

// 화면에 표시할 인증 안내 메시지 (null이면 표시 안 함)
export type AuthNotice = "SESSION_EXPIRED" | "LOGIN_REQUIRED" | null;

// 약관 종류 코드
export type AgreementTermCode = "TERMS_OF_SERVICE" | "PRIVACY_POLICY" | "MARKETING";

// ─── 인증/사용자 ───────────────────────────────────────────────

/** 로그인된 사용자 프로필 (전역 세션에 저장) */
export interface UserProfile {
  id: string;        // 서버 publicId (JWT subject)
  nickname: string;
  email: string;
  phone: string;
}

/** 카카오 콜백 이후 추가 정보 입력이 필요한 상태. signupToken으로 2단계 완료 */
export interface PendingSignup {
  signupToken: string;     // 서버 발급 임시 토큰 (30분 유효)
  email: string | null;    // 카카오가 준 이메일 (비공개 설정 시 null)
  nickname: string | null; // 카카오가 준 닉네임
}

/** 앱 전역 인증 세션 상태 */
export interface AuthSession {
  isAuthenticated: boolean;        // 로그인 완료 여부
  user: UserProfile | null;        // 로그인 시 사용자 정보
  accessToken: string | null;      // 메모리 저장 (새로고침 시 refresh로 재발급)
  authStatus: AuthStatus;          // 현재 인증 상태 머신 값
  pendingSignup: PendingSignup | null; // 회원가입 2단계 대기 정보
  authNotice: AuthNotice;          // 화면에 표시할 안내 메시지
}

/** 약관 동의 1건 */
export interface Agreement {
  termCode: AgreementTermCode;
  isRequired: boolean; // 필수 여부
  agreed: boolean;     // 동의 여부
}

/** 서버에서 받은 토큰 묶음 (로그인/재발급 공통) */
export interface TokenBundle {
  userId: string;          // 사용자 publicId
  accessToken: string;     // 단기 토큰 (API 인증)
  refreshToken: string;    // 장기 토큰 (localStorage에 저장)
  expiresIn: number | null; // access 토큰 만료(초)
}

/** 카카오 콜백 처리 결과 — 2가지 분기 포함 */
export interface KakaoCallbackResult {
  requiresProfileSetup: boolean; // true = 추가 정보 입력 필요
  signupToken: string | null;    // 추가 정보 입력 시 사용할 임시 토큰
  userId: string | null;
  email: string | null;
  nickname: string | null;
  accessToken: string | null;    // 기존 사용자는 바로 발급
  refreshToken: string | null;
  expiresIn: number | null;
}

/** 카카오 콜백 처리 요청 입력 */
export interface CompleteKakaoCallbackInput {
  code: string;        // 카카오가 준 인가 코드
  state: string;       // CSRF 방어용 state
  redirectUri: string; // 콜백 URL (카카오 앱 설정과 일치해야 함)
}

/** 회원가입 2단계 완료 입력 */
export interface CompleteSignupInput {
  signupToken: string;       // 카카오 콜백에서 받은 임시 토큰
  nickname: string;
  phone: string;
  marketingOptIn: boolean;
  agreements: Agreement[];   // 필수/선택 약관 동의 목록
}

// ─── 경매/입찰 ───────────────────────────────────────────────

/** 경매 1건 (목록/상세/스토어 공통 타입) */
export interface Auction {
  id: string;                     // 서버 publicId
  title: string;
  category: string;
  description: string;
  images: string[];               // 이미지 서빙 URL 목록 (sortOrder 순)
  condition: string;              // 상품 상태 (NEW / LIKE_NEW / USED 등)
  startPrice: number;             // 시작가
  currentBid: number;             // 현재 최고 입찰가
  bidCount: number;               // 입찰 건수
  buyNowPrice: number | null;     // 즉시구매가 (null = 즉시구매 불가)
  endAt: string;                  // 경매 마감 시각 (ISO 8601)
  createdAt: string;
  sellerId: string;               // 판매자 publicId
  sellerName: string;
  isSold: boolean;
  winnerUserId: string | null;    // 낙찰자 publicId
  highestBidderId: string | null; // 현재 최고 입찰자
  status: string;                 // ACTIVE / ENDED / CANCELLED
  startAt: string;                // 공개 시작 시각 (등록 후 5분 유예)
  imageIds?: string[];            // 서버 이미지 publicId 목록 (images와 동일 순서, 수정 시 필요)
}

/**
 * 등록/수정 폼에서 다루는 이미지 1건.
 * - id: 이미 서버에 저장된 이미지의 publicId (재업로드 없이 재사용)
 * - file: 신규 파일 (업로드 후 id 발급)
 * - url: 화면 표시용 (서버 URL 또는 objectURL)
 */
export interface AuctionImageInput {
  url: string;
  id?: string;
  file?: File;
}

/** 입찰 1건 */
export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName: string;
  amount: number;      // 입찰 금액 (원)
  createdAt: string;
  isHighest?: boolean; // 현재 최고가 입찰 여부 (입찰내역 강조용; 서버 isHighest 또는 WS 갱신값)
}

// ─── 결제 ─────────────────────────────────────────────────────

/** 결제 완료 레코드 */
export interface PaymentRecord {
  id: string;
  auctionId: string;
  buyerId: string;
  sellerId: string;
  method: PaymentMethod;
  amount: number;       // 낙찰가
  fee: number;          // 수수료
  totalAmount: number;  // 실제 결제 금액
  status: "paid";
  createdAt: string;
}

/** 결제 전 주문 요약 (결제 화면에서 조회) */
export interface PaymentOrderSummary {
  auction: Auction;
  amount: number;
  fee: number;
  totalAmount: number;
}

/** 경매 등록 입력 */
export interface CreateAuctionInput {
  title: string;
  category: string;
  description: string;
  condition: string;
  startPrice: number;
  buyNowPrice: number | null;
  endDateTime: string;      // ISO 8601
  images: AuctionImageInput[];
}

/** 경매 수정 입력 (기존+신규 이미지 혼합 가능) */
export interface UpdateAuctionInput {
  title: string;
  category: string;
  description: string;
  condition: string;
  startPrice: number;
  buyNowPrice: number | null;
  endDateTime: string;
  images: AuctionImageInput[]; // 기존(id) + 신규(file) 혼합 가능
}

/** 입찰 요청 입력 */
export interface PlaceBidInput {
  auctionId: string;
  amount: number;
  bidderId: string;
  bidderName: string;
}

/** WS 수신: 입찰 갱신 broadcast (/topic/auction/{id}) */
export interface BidUpdateMessage {
  type: "BID_UPDATE";
  currentPrice: number;
  bidCount: number;
  remainingTime: number; // 종료까지 남은 초 (참고용)
  maskedBidder: string;  // 마스킹된 입찰자 닉네임 (서버에서 마스킹)
}

/** WS 수신: 경매 종료 broadcast */
export interface AuctionEndedMessage {
  type: "AUCTION_ENDED";
  finalPrice: number;
  winnerId: string | null; // 낙찰자 publicId (입찰 없으면 null)
}

/** 결제 완료 처리 입력 */
export interface CompletePaymentInput {
  auctionId: string;
  buyerId: string;
  method: PaymentMethod;
}

// ─── 앱 전역 상태 ──────────────────────────────────────────────

/**
 * 앱 전역 상태 스냅샷.
 * React 외부에서 관리(appStore.ts)하며 useSyncExternalStore로 구독한다.
 */
export interface AppState {
  users: UserProfile[];
  session: AuthSession;
  auctions: Auction[];     // 서버에서 가져온 경매 목록 (스토어 캐시)
  bids: Bid[];             // 입찰 내역
  payments: PaymentRecord[];
  counters: {              // mock 데이터 ID 생성용 카운터
    auction: number;
    bid: number;
    payment: number;
    user: number;
  };
}

