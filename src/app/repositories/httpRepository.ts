import type {
  CompletePaymentInput,
  CreateAuctionInput,
  PlaceBidInput,
  UserProfile,
} from "../domain/types";
import type { AuthRepository, AuctionRepository, PaymentRepository } from "./contracts";

function notImplemented(): never {
  throw new Error("HttpRepository는 1차 범위에서 아직 연결되지 않았습니다.");
}

const auction: AuctionRepository = {
  async listAuctions() {
    return notImplemented();
  },
  async getAuctionById() {
    return notImplemented();
  },
  async listAuctionBids() {
    return notImplemented();
  },
  async createAuction(_input: CreateAuctionInput, _seller: UserProfile) {
    return notImplemented();
  },
  async placeBid(_input: PlaceBidInput) {
    return notImplemented();
  },
  async listAuctionsBySeller() {
    return notImplemented();
  },
  async listBiddingAuctions() {
    return notImplemented();
  },
  async listWinningAuctions() {
    return notImplemented();
  },
  async markAuctionPaid() {
    return notImplemented();
  },
};

const auth: AuthRepository = {
  async getSession() {
    return notImplemented();
  },
  async login() {
    return notImplemented();
  },
  async signup() {
    return notImplemented();
  },
  async logout() {
    return notImplemented();
  },
};

const payment: PaymentRepository = {
  async getOrderSummary() {
    return notImplemented();
  },
  async completePayment(_input: CompletePaymentInput) {
    return notImplemented();
  },
  async listPayments() {
    return notImplemented();
  },
};

export const httpRepository = {
  auction,
  auth,
  payment,
};
