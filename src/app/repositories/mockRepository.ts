import type {
  Auction,
  Bid,
  CompletePaymentInput,
  CreateAuctionInput,
  PaymentOrderSummary,
  PaymentRecord,
  PlaceBidInput,
  UserProfile,
} from "../domain/types";
import { getAppState, setAppState } from "../state/appStore";
import type { AuthRepository, AuctionRepository, PaymentRepository } from "./contracts";

const BID_STEP = 10000;
const FEE_RATE = 0.03;

function nowIso(): string {
  return new Date().toISOString();
}

function nextId(prefix: "auction" | "bid" | "payment" | "user"): string {
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
  if (!nickname) {
    return "게스트";
  }
  return `${nickname.slice(0, 1)}**`;
}

const auctionRepository: AuctionRepository = {
  async listAuctions() {
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

  async placeBid(input) {
    const auction = getAuctionOrNull(input.auctionId);
    if (!auction) {
      throw new Error("해당 경매를 찾을 수 없습니다.");
    }
    if (auction.isSold) {
      throw new Error("이미 결제 완료된 경매입니다.");
    }

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
  async getSession() {
    return getAppState().session;
  },

  async login(email) {
    const state = getAppState();
    let user = state.users.find((item) => item.email === email) ?? null;

    if (!user) {
      const nickname = email.split("@")[0] || "사용자";
      user = {
        id: nextId("user"),
        nickname,
        email,
        phone: "",
      };

      setAppState((prev) => ({
        ...prev,
        users: [...prev.users, user!],
      }));
    }

    const session = { isAuthenticated: true, user };
    setAppState((prev) => ({
      ...prev,
      session,
    }));
    return session;
  },

  async signup(input) {
    const state = getAppState();
    const existing = state.users.find((item) => item.email === input.email);
    if (existing) {
      const session = { isAuthenticated: true, user: existing };
      setAppState((prev) => ({ ...prev, session }));
      return session;
    }

    const created: UserProfile = {
      id: nextId("user"),
      nickname: input.nickname || "사용자",
      email: input.email,
      phone: input.phone,
    };

    const session = { isAuthenticated: true, user: created };
    setAppState((prev) => ({
      ...prev,
      users: [...prev.users, created],
      session,
    }));
    return session;
  },

  async logout() {
    setAppState((prev) => ({
      ...prev,
      session: { isAuthenticated: false, user: null },
    }));
  },
};

const paymentRepository: PaymentRepository = {
  async getOrderSummary(auctionId) {
    const auction = getAuctionOrNull(auctionId);
    if (!auction) {
      return null;
    }
    const amount = auction.currentBid;
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
