import type {
  Auction,
  Bid,
  CompletePaymentInput,
  CreateAuctionInput,
  PaymentOrderSummary,
  PaymentRecord,
  PlaceBidInput,
} from "../domain/types";
import { getAppState, setAppState } from "../state/appStore";
import type { AuthRepository, AuctionRepository, PaymentRepository } from "./contracts";

const BID_STEP = 10000;
const FEE_RATE = 0.03;

function nowIso(): string {
  return new Date().toISOString();
}

function nextId(prefix: "auction" | "bid" | "payment" | "user"): string {
  // 단순 카운터 기반 ID 발급: mock 환경에서 충돌 없이 식별자 생성용입니다.
  const state = getAppState();
  const value = state.counters[prefix];

  setAppState((prev) => ({
    ...prev,
    counters: {
      ...prev.counters,
      [prefix]: prev.counters[prefix] + 1,
    },
  }));

  return `${prefix}-${value}`;
}

function getAuctionOrNull(auctionId: string): Auction | null {
  const auction = getAppState().auctions.find((item) => item.id === auctionId);
  return auction ?? null;
}

function maskBidderName(nickname: string): string {
  // 입찰 내역 노출 시 개인정보 보호를 위해 닉네임을 마스킹합니다.
  if (!nickname) {
    return "게스트";
  }
  return `${nickname.slice(0, 1)}**`;
}

const auctionRepository: AuctionRepository = {
  async listAuctions() {
    // 홈 화면에서 마감 임박순으로 보이도록 정렬해 반환합니다.
    return [...getAppState().auctions].sort((a, b) => {
      return new Date(a.endAt).getTime() - new Date(b.endAt).getTime();
    });
  },

  async getAuctionById(auctionId) {
    return getAuctionOrNull(auctionId);
  },

  async listAuctionBids(auctionId) {
    return getAppState()
      .bids
      .filter((item) => item.auctionId === auctionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createAuction(input, seller) {
    const created: Auction = {
      id: nextId("auction"),
      title: input.title,
      category: input.category,
      description: input.description,
      images: input.images.length > 0 ? input.images : ["/fallback-image"],
      condition: input.condition,
      startPrice: input.startPrice,
      currentBid: input.startPrice,
      bidCount: 0,
      buyNowPrice: input.buyNowPrice,
      endAt: input.endDateTime || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      createdAt: nowIso(),
      sellerId: seller.id,
      sellerName: seller.nickname,
      isSold: false,
      winnerUserId: null,
      highestBidderId: null,
    };

    setAppState((prev) => ({
      ...prev,
      auctions: [created, ...prev.auctions],
    }));

    return created;
  },

  async placeBid(input: PlaceBidInput) {
    const auction = getAuctionOrNull(input.auctionId);
    if (!auction) {
      throw new Error("해당 경매를 찾을 수 없습니다.");
    }
    if (auction.isSold) {
      throw new Error("이미 결제가 완료된 경매입니다.");
    }

    // 최소 입찰 단위(BID_STEP)를 강제해 현재가보다 낮은 금액을 자동 보정합니다.
    const amount = Math.max(input.amount, auction.currentBid + BID_STEP);
    const bid: Bid = {
      id: nextId("bid"),
      auctionId: auction.id,
      bidderId: input.bidderId,
      bidderName: maskBidderName(input.bidderName),
      amount,
      createdAt: nowIso(),
    };

    let updatedAuction: Auction = auction;
    setAppState((prev) => {
      const nextAuctions = prev.auctions.map((item) => {
        if (item.id !== auction.id) {
          return item;
        }
        updatedAuction = {
          ...item,
          currentBid: amount,
          bidCount: item.bidCount + 1,
          highestBidderId: input.bidderId,
        };
        return updatedAuction;
      });

      return {
        ...prev,
        // 최신 입찰이 상단에 보이도록 배열 앞에 추가합니다.
        auctions: nextAuctions,
        bids: [bid, ...prev.bids],
      };
    });

    return { auction: updatedAuction, bid };
  },

  async listAuctionsBySeller(sellerId) {
    return getAppState().auctions.filter((item) => item.sellerId === sellerId);
  },

  async listBiddingAuctions(bidderId) {
    const auctionIds = new Set(
      getAppState()
        .bids
        .filter((item) => item.bidderId === bidderId)
        .map((item) => item.auctionId),
    );
    return getAppState().auctions.filter((item) => auctionIds.has(item.id));
  },

  async listWinningAuctions(userId) {
    return getAppState().auctions.filter(
      (item) => item.winnerUserId === userId || (item.isSold && item.highestBidderId === userId),
    );
  },

  async markAuctionPaid(auctionId, buyerId) {
    const target = getAuctionOrNull(auctionId);
    if (!target) {
      return null;
    }

    let updatedAuction: Auction = target;
    setAppState((prev) => ({
      ...prev,
      auctions: prev.auctions.map((item) => {
        if (item.id !== auctionId) {
          return item;
        }
        // 결제 완료 시 낙찰자 정보를 확정하고 재결제를 막기 위해 isSold를 true로 변경합니다.
        updatedAuction = {
          ...item,
          isSold: true,
          winnerUserId: buyerId,
          highestBidderId: buyerId,
        };
        return updatedAuction;
      }),
    }));

    return updatedAuction;
  },
};

const authRepository: AuthRepository = {
  async getKakaoLoginUrl() {
    return {
      authorizeUrl: "/auth/kakao/callback?code=mock-code&state=mock-state",
      state: "mock-state",
    };
  },

  async completeKakaoCallback() {
    throw new Error("Mock auth repository에서는 카카오 콜백을 지원하지 않습니다.");
  },

  async completeSignup() {
    throw new Error("Mock auth repository에서는 회원가입 완료를 지원하지 않습니다.");
  },

  async refresh() {
    throw new Error("Mock auth repository에서는 토큰 갱신을 지원하지 않습니다.");
  },

  async logout() {
    setAppState((prev) => ({
      ...prev,
      session: {
        ...prev.session,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        authStatus: "anonymous",
        pendingSignup: null,
        authNotice: null,
      },
    }));
  },

  async getMe() {
    const currentUser = getAppState().session.user;
    if (!currentUser) {
      throw new Error("로그인이 필요합니다.");
    }
    return currentUser;
  },

  async restoreSession() {
    setAppState((prev) => ({
      ...prev,
      session: {
        ...prev.session,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        authStatus: "anonymous",
        pendingSignup: null,
        authNotice: null,
      },
    }));
    return getAppState().session;
  },
};

const paymentRepository: PaymentRepository = {
  async getOrderSummary(auctionId) {
    const auction = getAuctionOrNull(auctionId);
    if (!auction) {
      return null;
    }
    const amount = auction.currentBid;
    // 수수료는 고정 비율(FEE_RATE) 정책을 사용합니다.
    const fee = Math.round(amount * FEE_RATE);
    return {
      auction,
      amount,
      fee,
      totalAmount: amount + fee,
    } satisfies PaymentOrderSummary;
  },

  async completePayment(input: CompletePaymentInput) {
    const summary = await paymentRepository.getOrderSummary(input.auctionId);
    if (!summary) {
      return null;
    }

    const paidAuction = await auctionRepository.markAuctionPaid(input.auctionId, input.buyerId);
    if (!paidAuction) {
      return null;
    }

    const payment: PaymentRecord = {
      id: nextId("payment"),
      auctionId: input.auctionId,
      buyerId: input.buyerId,
      sellerId: summary.auction.sellerId,
      method: input.method,
      amount: summary.amount,
      fee: summary.fee,
      totalAmount: summary.totalAmount,
      status: "paid",
      createdAt: nowIso(),
    };

    setAppState((prev) => ({
      ...prev,
      // 결제 이력 최신순 정렬을 위해 앞에 삽입합니다.
      payments: [payment, ...prev.payments],
    }));

    return payment;
  },

  async listPayments(userId) {
    return getAppState().payments.filter((item) => item.buyerId === userId);
  },
};

export const mockRepository = {
  auction: auctionRepository,
  auth: authRepository,
  payment: paymentRepository,
};
