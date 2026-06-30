import type {
  Auction,
  AuctionImageInput,
  AuthNotice,
  AuthSession,
  Bid,
  CompleteKakaoCallbackInput,
  CompleteSignupInput,
  CreateAuctionInput,
  KakaoCallbackResult,
  PendingSignup,
  PlaceBidInput,
  TokenBundle,
  UpdateAuctionInput,
  UserProfile,
} from "../domain/types";
import { getAppState, setAppState } from "../state/appStore";
import type { ApiError as ApiErrorShape, ApiResponse, AuctionRepository, AuthRepository } from "./contracts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const REFRESH_TOKEN_KEY = "ym_refresh_token";
const OAUTH_STATE_KEY = "ym_oauth_state";
const PENDING_SIGNUP_KEY = "ym_pending_signup";

class HttpApiError extends Error implements ApiErrorShape {
  status: number;
  code: string | null;

  constructor(status: number, message: string, code: string | null = null) {
    super(message);
    this.name = "HttpApiError";
    this.status = status;
    this.code = code;
  }
}

let refreshPromise: Promise<string | null> | null = null;

function redirectToAuthIfNeeded(): void {
  if (window.location.pathname.startsWith("/auth")) {
    return;
  }
  window.location.href = "/auth";
}

function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setRefreshToken(value: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, value);
}

function clearRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function setOAuthState(state: string): void {
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
}

function getOAuthState(): string | null {
  return sessionStorage.getItem(OAUTH_STATE_KEY);
}

function clearOAuthState(): void {
  sessionStorage.removeItem(OAUTH_STATE_KEY);
}

function savePendingSignup(value: PendingSignup): void {
  sessionStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(value));
}

function loadPendingSignup(): PendingSignup | null {
  const raw = sessionStorage.getItem(PENDING_SIGNUP_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PendingSignup;
    if (!parsed.signupToken) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearPendingSignup(): void {
  sessionStorage.removeItem(PENDING_SIGNUP_KEY);
}

function mapMeResponse(payload: unknown): UserProfile {
  if (!payload || typeof payload !== "object") {
    throw new HttpApiError(500, "?ъ슜???뺣낫瑜??쎌쓣 ???놁뒿?덈떎.", "INVALID_ME_PAYLOAD");
  }

  const source = payload as Record<string, unknown>;
  const userId = source.userId ?? source.id;
  const nickname = source.nickname;
  const email = source.email;
  const phone = source.phone;

  if (typeof userId !== "string" && typeof userId !== "number") {
    throw new HttpApiError(500, "?ъ슜??ID媛 ?놁뒿?덈떎.", "INVALID_ME_PAYLOAD");
  }

  return {
    id: String(userId),
    nickname: typeof nickname === "string" ? nickname : "?뚯썝",
    email: typeof email === "string" ? email : "",
    phone: typeof phone === "string" ? phone : "",
  };
}

function parseApiPayload<T>(payload: unknown, allowPlain = false): T {
  // 백엔드 응답이 { success, data } 래퍼 형식인지, 평문 JSON인지 모두 수용합니다.
  if (payload && typeof payload === "object" && "success" in payload) {
    const wrapped = payload as ApiResponse<T>;
    if (!wrapped.success) {
      throw new HttpApiError(400, wrapped.message ?? "?붿껌???ㅽ뙣?덉뒿?덈떎.", wrapped.code ?? null);
    }
    return wrapped.data;
  }

  if (allowPlain) {
    return payload as T;
  }

  return payload as T;
}

async function parseResponse<T>(
  response: Response,
  options?: {
    allowPlain?: boolean;
    defaultErrorCode?: string;
  },
): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;
  const allowPlain = options?.allowPlain ?? false;

  if (!response.ok) {
    // 서버가 에러를 내려준 경우 메시지/코드를 최대한 보존해 화면에서 그대로 보여줄 수 있게 합니다.
    if (body && typeof body === "object" && "success" in body) {
      const errorBody = body as ApiResponse<unknown>;
      throw new HttpApiError(
        response.status,
        errorBody.message ?? "?붿껌???ㅽ뙣?덉뒿?덈떎.",
        errorBody.code ?? options?.defaultErrorCode ?? null,
      );
    }

    if (body && typeof body === "object" && "message" in body) {
      const message = String((body as Record<string, unknown>).message ?? "?붿껌???ㅽ뙣?덉뒿?덈떎.");
      const codeValue = (body as Record<string, unknown>).code;
      throw new HttpApiError(
        response.status,
        message,
        typeof codeValue === "string" ? codeValue : options?.defaultErrorCode ?? null,
      );
    }

    throw new HttpApiError(
      response.status,
      "?붿껌???ㅽ뙣?덉뒿?덈떎.",
      options?.defaultErrorCode ?? null,
    );
  }

  if (!isJson) {
    throw new HttpApiError(
      500,
      "API ?묐떟 ?뺤떇???щ컮瑜댁? ?딆뒿?덈떎. ?꾨줎?몄쓽 API 二쇱냼 ?먮뒗 媛쒕컻 ?쒕쾭 ?꾨줉???ㅼ젙???뺤씤??二쇱꽭??",
      options?.defaultErrorCode ?? "INVALID_RESPONSE",
    );
  }

  if (body == null) {
    throw new HttpApiError(
      500,
      "API ?묐떟??鍮꾩뼱 ?덉뒿?덈떎. 諛깆뿏???쒕쾭媛 ?ㅽ뻾 以묒씤吏 ?뺤씤??二쇱꽭??",
      options?.defaultErrorCode ?? "EMPTY_RESPONSE",
    );
  }

  return parseApiPayload<T>(body, allowPlain);
}

function toAnonymousSession(
  pendingSignup: PendingSignup | null,
  authNotice: AuthNotice = null,
): AuthSession {
  return {
    isAuthenticated: false,
    user: null,
    accessToken: null,
    authStatus: "anonymous",
    pendingSignup,
    authNotice,
  };
}

function applyAnonymousSession(
  pendingSignup: PendingSignup | null = null,
  authNotice: AuthNotice = null,
): void {
  setAppState((prev) => ({
    ...prev,
    session: toAnonymousSession(pendingSignup, authNotice),
  }));
}

function applyPendingSignupSession(pendingSignup: PendingSignup): void {
  setAppState((prev) => ({
    ...prev,
    session: {
      ...prev.session,
      isAuthenticated: false,
      user: null,
      accessToken: null,
      authStatus: "anonymous",
      pendingSignup,
      authNotice: null,
    },
  }));
}

function applyAuthenticatedSession(user: UserProfile, accessToken: string): void {
  setAppState((prev) => {
    // users 목록에는 최신 사용자 정보를 덮어써 중복을 방지합니다.
    const usersWithoutCurrent = prev.users.filter((item) => item.id !== user.id);
    return {
      ...prev,
      users: [...usersWithoutCurrent, user],
      session: {
        ...prev.session,
        isAuthenticated: true,
        user,
        accessToken,
        authStatus: "authenticated",
        pendingSignup: null,
        authNotice: null,
      },
    };
  });
}

function clearLocalAuthArtifacts(): void {
  clearRefreshToken();
  clearOAuthState();
  clearPendingSignup();
}

function assertHasTokens(
  payload: Pick<KakaoCallbackResult, "accessToken" | "refreshToken">,
): asserts payload is Pick<TokenBundle, "accessToken" | "refreshToken"> {
  if (!payload.accessToken || !payload.refreshToken) {
    throw new HttpApiError(500, "?좏겙 ?뺣낫媛 鍮꾩뼱 ?덉뒿?덈떎.", "INVALID_TOKEN_BUNDLE");
  }
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
  options?: {
    allowPlain?: boolean;
    defaultErrorCode?: string;
  },
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  return parseResponse<T>(response, options);
}

async function requestRefreshTokenBundle(refreshToken: string): Promise<TokenBundle> {
  return requestJson<TokenBundle>(
    "/auth/refresh",
    {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    },
    {
      defaultErrorCode: "UNAUTHORIZED",
    },
  );
}

async function refreshAccessTokenShared(): Promise<string | null> {
  // 동시에 여러 API가 401을 만났을 때 refresh 요청을 1번만 보내도록 공유 Promise를 사용합니다.
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  refreshPromise = (async () => {
    try {
      const tokenBundle = await requestRefreshTokenBundle(refreshToken);
      setRefreshToken(tokenBundle.refreshToken);
      setAppState((prev) => ({
        ...prev,
        session: {
          ...prev.session,
          accessToken: tokenBundle.accessToken,
          authStatus: "authenticated",
          authNotice: null,
        },
      }));
      return tokenBundle.accessToken;
    } catch {
      clearLocalAuthArtifacts();
      applyAnonymousSession(null, "SESSION_EXPIRED");
      redirectToAuthIfNeeded();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function authFetch<T>(
  path: string,
  init?: RequestInit,
  options?: {
    allowPlain?: boolean;
    retryOnUnauthorized?: boolean;
    defaultErrorCode?: string;
    accessTokenOverride?: string | null;
  },
): Promise<T> {
  const retryOnUnauthorized = options?.retryOnUnauthorized ?? true;
  const accessToken = options?.accessTokenOverride ?? getAppState().session.accessToken;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (response.status === 401 && retryOnUnauthorized) {
    // 만료된 access token은 refresh 후 같은 요청을 1회 재시도합니다.
    const refreshedToken = await refreshAccessTokenShared();
    if (refreshedToken) {
      const retried = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
          Authorization: `Bearer ${refreshedToken}`,
        },
      });
      return parseResponse<T>(retried, options);
    }
  }

  return parseResponse<T>(response, options);
}

async function requestMe(
  retryOnUnauthorized = true,
  accessTokenOverride?: string | null,
): Promise<UserProfile> {
  const payload = await authFetch<unknown>("/users/me", undefined, {
    allowPlain: true,
    retryOnUnauthorized,
    defaultErrorCode: "UNAUTHORIZED",
    accessTokenOverride,
  });
  return mapMeResponse(payload);
}

// --- 경매: 한글 라벨 ↔ 백엔드 ENUM 매핑 ---
const CATEGORY_TO_ENUM: Record<string, string> = {
  "전자기기": "ELECTRONICS",
  "패션": "FASHION",
  "생활/가전": "HOME_APPLIANCE",
  "수집품": "COLLECTIBLE",
  "스포츠": "SPORTS",
  "기타": "ETC",
};
const ENUM_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_TO_ENUM).map(([label, code]) => [code, label]),
);
const CONDITION_TO_ENUM: Record<string, string> = {
  "미사용": "UNUSED",
  "거의새것": "LIKE_NEW",
  "사용감있음": "USED",
};
const ENUM_TO_CONDITION: Record<string, string> = Object.fromEntries(
  Object.entries(CONDITION_TO_ENUM).map(([label, code]) => [code, label]),
);

function toCategoryEnum(label: string): string {
  return CATEGORY_TO_ENUM[label] ?? "ETC";
}
function toConditionEnum(label: string): string {
  return CONDITION_TO_ENUM[label] ?? "USED";
}
function fromCategoryEnum(code: string | undefined): string {
  return code ? ENUM_TO_CATEGORY[code] ?? code : "";
}
function fromConditionEnum(code: string | undefined): string {
  return code ? ENUM_TO_CONDITION[code] ?? code : "";
}

function toServerDateTime(value: string): string {
  if (!value) return value;
  return value.length === 16 ? `${value}:00` : value;
}

function normalizeAuction(payload: Record<string, unknown>): Auction {
  const images = Array.isArray(payload.images)
    ? (payload.images as string[])
    : payload.thumbnailUrl
      ? [payload.thumbnailUrl as string]
      : [];
  const imageIds = Array.isArray(payload.imageIds)
    ? (payload.imageIds as string[])
    : undefined;
  const seller = (payload.seller ?? {}) as Record<string, unknown>;
  // 공개 예정 시각: startTime이 있으면 사용, 없으면(목록 응답 등) 과거값으로 둬서
  // 서버가 이미 필터링한 목록을 프론트에서 다시 숨기지 않도록 한다.
  const startAt = payload.startTime
    ? String(payload.startTime)
    : payload.createdAt
      ? String(payload.createdAt)
      : new Date(0).toISOString();
  const sellerId = seller.userId
    ? String(seller.userId)
    : payload.sellerId
      ? String(payload.sellerId)
      : "";
  return {
    id: String(payload.auctionId ?? ""),
    title: String(payload.title ?? ""),
    category: fromCategoryEnum(payload.category as string | undefined),
    description: String(payload.description ?? ""),
    images,
    imageIds,
    condition: fromConditionEnum(payload.condition as string | undefined),
    startPrice: Number(payload.startPrice ?? payload.currentPrice ?? 0),
    currentBid: Number(payload.currentPrice ?? 0),
    bidCount: Number(payload.bidCount ?? 0),
    buyNowPrice:
      payload.buyNowPrice === null || payload.buyNowPrice === undefined
        ? null
        : Number(payload.buyNowPrice),
    endAt: String(payload.endTime ?? ""),
    createdAt: String(payload.createdAt ?? payload.startTime ?? new Date().toISOString()),
    sellerId,
    sellerName: seller.nickname ? String(seller.nickname) : "판매자",
    isSold: String(payload.status ?? "") === "PAID",
    winnerUserId: payload.winnerUserId ? String(payload.winnerUserId) : null,
    highestBidderId: null,
    status: String(payload.status ?? "ACTIVE"),
    startAt,
  };
}

async function resolveImageIds(images: AuctionImageInput[]): Promise<string[]> {
  // 기존 이미지(id 보유)는 그대로 재사용하고, 신규 파일만 업로드해 imageId를 발급받는다.
  // 순서를 보존해야 대표 이미지(첫 번째)와 정렬이 유지된다.
  const imageIds: string[] = [];
  for (const item of images) {
    if (item.id) {
      imageIds.push(item.id);
      continue;
    }
    if (!item.file) {
      continue;
    }
    const form = new FormData();
    form.append("file", item.file, item.file.name || "upload");
    const accessToken = getAppState().session.accessToken;
    const response = await fetch(`${API_BASE_URL}/images/upload`, {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: form,
    });
    const uploaded = await parseResponse<{ imageId: string; url: string }>(response);
    imageIds.push(uploaded.imageId);
  }
  return imageIds;
}

const auction: AuctionRepository = {
  async listAuctions() {
    const data = await requestJson<{ content: Record<string, unknown>[] }>(
      "/auctions?page=0&size=50&sort=endTime,asc",
      { method: "GET" },
    );
    return (data.content ?? []).map(normalizeAuction);
  },

  async getAuctionById(auctionId) {
    try {
      const data = await authFetch<Record<string, unknown>>(`/auctions/${auctionId}`, {
        method: "GET",
      });
      return normalizeAuction(data);
    } catch {
      return null;
    }
  },

  async listAuctionsBySeller(_sellerId: string) {
    const data = await authFetch<Record<string, unknown>[]>("/auctions/mine", {
      method: "GET",
    });
    return (data ?? []).map(normalizeAuction);
  },

  async createAuction(input: CreateAuctionInput, _seller: UserProfile) {
    const imageIds = await resolveImageIds(input.images);
    const data = await authFetch<Record<string, unknown>>("/auctions", {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        category: toCategoryEnum(input.category),
        condition: toConditionEnum(input.condition),
        startPrice: input.startPrice,
        buyNowPrice: input.buyNowPrice,
        endTime: toServerDateTime(input.endDateTime),
        imageIds,
      }),
    });
    const created = await this.getAuctionById(String(data.auctionId));
    return created ?? normalizeAuction(data);
  },

  async updateAuction(auctionId: string, input: UpdateAuctionInput) {
    const imageIds = await resolveImageIds(input.images);
    const data = await authFetch<Record<string, unknown>>(`/auctions/${auctionId}`, {
      method: "PUT",
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        category: toCategoryEnum(input.category),
        condition: toConditionEnum(input.condition),
        startPrice: input.startPrice,
        buyNowPrice: input.buyNowPrice,
        endTime: toServerDateTime(input.endDateTime),
        imageIds,
      }),
    });
    return normalizeAuction(data);
  },

  async deleteAuction(auctionId: string) {
    await authFetch<null>(`/auctions/${auctionId}`, { method: "DELETE" });
  },

  // 입찰 내역(공개): 서버가 닉네임을 마스킹해 내려주므로 그대로 사용한다.
  async listAuctionBids(auctionId: string) {
    const data = await requestJson<{
      content: { maskedNickname: string; price: number; createdAt: string; isHighest: boolean }[];
    }>(`/auctions/${auctionId}/bids?page=0&size=50`, { method: "GET" });
    return (data.content ?? []).map((item, index): Bid => ({
      id: `${auctionId}-${index}-${item.createdAt}`,
      auctionId,
      bidderId: "", // 서버가 입찰자 식별자를 노출하지 않음(마스킹)
      bidderName: item.maskedNickname,
      amount: item.price,
      createdAt: item.createdAt,
      isHighest: item.isHighest,
    }));
  },

  // 입찰(인증): POST 후 응답으로 스토어의 경매를 patch한 사본 + 내 입찰 1건을 반환한다.
  async placeBid(input: PlaceBidInput) {
    const data = await authFetch<{
      bidId: string;
      price: number;
      currentHighestPrice: number;
      bidCount: number;
      createdAt: string;
    }>(`/auctions/${input.auctionId}/bids`, {
      method: "POST",
      body: JSON.stringify({ amount: input.amount }),
    });

    // 반환 계약({ auction, bid })을 채우기 위해 기존 경매를 기준으로 현재가/입찰수를 갱신
    const existing = getAppState().auctions.find((item) => item.id === input.auctionId);
    const baseAuction = existing ?? (await this.getAuctionById(input.auctionId));
    if (!baseAuction) {
      throw new HttpApiError(404, "경매를 찾을 수 없습니다.", "AUCTION_NOT_FOUND");
    }
    const auction: Auction = {
      ...baseAuction,
      currentBid: data.currentHighestPrice,
      bidCount: data.bidCount,
      highestBidderId: input.bidderId,
    };
    const bid: Bid = {
      id: data.bidId,
      auctionId: input.auctionId,
      bidderId: input.bidderId,
      bidderName: input.bidderName,
      amount: data.price,
      createdAt: data.createdAt,
      isHighest: true,
    };
    return { auction, bid };
  },

  // 아래 3개는 아직 http 미구현 → index.ts에서 mock으로 합성한다(contracts 충족용 stub).
  async listBiddingAuctions() { return []; },
  async listWinningAuctions() { return []; },
  async markAuctionPaid() { return null; },
};

const auth: AuthRepository = {
  async getKakaoLoginUrl() {
    const data = await requestJson<{ authorizeUrl: string; state: string }>(
      "/auth/kakao/login",
      { method: "GET" },
    );
    if (!data || !data.authorizeUrl || !data.state) {
      throw new HttpApiError(500, "移댁뭅??濡쒓렇??URL??諛쏆? 紐삵뻽?듬땲??", "OAUTH_ERROR");
    }
    setOAuthState(data.state);
    // CSRF 방지를 위해 서버가 내려준 state를 저장해 콜백에서 검증합니다.
    return data;
  },

  async completeKakaoCallback(input: CompleteKakaoCallbackInput) {
    const expectedState = getOAuthState();

    if (!input.code || !input.state) {
      throw new HttpApiError(400, "카카오 인증 상태가 올바르지 않습니다.", "OAUTH_ERROR");
    }
    if (expectedState && expectedState !== input.state) {
      throw new HttpApiError(400, "카카오 인증 상태가 올바르지 않습니다.", "OAUTH_ERROR");
    }

    try {
      const result = await requestJson<KakaoCallbackResult>(
        "/auth/kakao/callback",
        {
          method: "POST",
          body: JSON.stringify(input),
        },
        {
          defaultErrorCode: "OAUTH_ERROR",
        },
      );

      if (result.requiresProfileSetup) {
        if (!result.signupToken) {
          throw new HttpApiError(500, "추가 정보 입력 토큰이 없습니다.", "OAUTH_ERROR");
        }
        const pendingSignup: PendingSignup = {
          signupToken: result.signupToken,
          email: result.email ?? null,
          nickname: result.nickname ?? null,
        };
        savePendingSignup(pendingSignup);
        // 추가 정보 입력이 필요한 사용자는 세션을 pending 상태로 유지합니다.
        applyPendingSignupSession(pendingSignup);
        return result;
      }

      assertHasTokens(result);
      setRefreshToken(result.refreshToken);
      clearPendingSignup();
      const me = await requestMe(false, result.accessToken);
      applyAuthenticatedSession(me, result.accessToken);
      return result;
    } finally {
      clearOAuthState();
    }
  },

  async completeSignup(input: CompleteSignupInput) {
    const tokenBundle = await requestJson<TokenBundle>(
      "/auth/signup/complete",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      {
        defaultErrorCode: "VALIDATION_ERROR",
      },
    );

    setRefreshToken(tokenBundle.refreshToken);
    clearPendingSignup();
    const me = await requestMe(false, tokenBundle.accessToken);
    applyAuthenticatedSession(me, tokenBundle.accessToken);
    return tokenBundle;
  },

  async refresh(input: { refreshToken: string }) {
    const tokenBundle = await requestRefreshTokenBundle(input.refreshToken);
    setRefreshToken(tokenBundle.refreshToken);
    setAppState((prev) => ({
      ...prev,
      session: {
        ...prev.session,
        accessToken: tokenBundle.accessToken,
        authNotice: null,
      },
    }));
    return tokenBundle;
  },

  async logout() {
    try {
      if (getAppState().session.accessToken) {
        await authFetch<null>(
          "/auth/logout",
          { method: "POST" },
          {
            retryOnUnauthorized: false,
          },
        );
      }
    } finally {
      clearLocalAuthArtifacts();
      applyAnonymousSession();
    }
  },

  async getMe() {
    const me = await requestMe(true);
    const accessToken = getAppState().session.accessToken;
    if (!accessToken) {
      throw new HttpApiError(401, "?몄쬆??留뚮즺?섏뿀?듬땲??", "UNAUTHORIZED");
    }
    applyAuthenticatedSession(me, accessToken);
    return me;
  },

  async restoreSession() {
    // 앱 부팅 시 가장 먼저 호출되어 인증 상태를 복구합니다.
    setAppState((prev) => ({
      ...prev,
      session: {
        ...prev.session,
        authStatus: "bootstrapping",
        authNotice: null,
      },
    }));

    const pendingSignup = loadPendingSignup();
    if (pendingSignup) {
      applyPendingSignupSession(pendingSignup);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      // 저장된 토큰이 없으면 익명 세션으로 두고, 필요 시 로그인 안내 메시지를 띄웁니다.
      applyAnonymousSession(pendingSignup, pendingSignup ? null : "LOGIN_REQUIRED");
      return getAppState().session;
    }

    try {
      const tokenBundle = await requestRefreshTokenBundle(refreshToken);
      setRefreshToken(tokenBundle.refreshToken);
      setAppState((prev) => ({
        ...prev,
        session: {
          ...prev.session,
          accessToken: tokenBundle.accessToken,
          authStatus: "authenticated",
          authNotice: null,
        },
      }));
      const me = await requestMe(false);
      clearPendingSignup();
      applyAuthenticatedSession(me, tokenBundle.accessToken);
      return getAppState().session;
    } catch {
      clearLocalAuthArtifacts();
      applyAnonymousSession(null, "SESSION_EXPIRED");
      return getAppState().session;
    }
  },
};

export const httpRepository = {
  auth,
  auction,
};
