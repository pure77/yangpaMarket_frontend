import type {
  Auction,
  AuthSession,
  Bid,
  CompletePaymentInput,
  CreateAuctionInput,
  PaymentOrderSummary,
  PaymentRecord,
  PlaceBidInput,
  UserProfile,
} from "../domain/types";

export interface AuctionRepository {
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
  getSession(): Promise<AuthSession>;
  login(email: string, password: string): Promise<AuthSession>;
  signup(input: {
    nickname: string;
    email: string;
    password: string;
    phone: string;
  }): Promise<AuthSession>;
  logout(): Promise<void>;
}

export interface PaymentRepository {
  getOrderSummary(auctionId: string): Promise<PaymentOrderSummary | null>;
  completePayment(input: CompletePaymentInput): Promise<PaymentRecord | null>;
  listPayments(userId: string): Promise<PaymentRecord[]>;
}
