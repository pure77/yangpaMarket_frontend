export type PaymentMethod = "kakaopay" | "tosspay" | "card" | "bank";

export interface UserProfile {
  id: string;
  nickname: string;
  email: string;
  phone: string;
}

export interface AuthSession {
  isAuthenticated: boolean;
  user: UserProfile | null;
}

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

export interface CompletePaymentInput {
  auctionId: string;
  buyerId: string;
  method: PaymentMethod;
}

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
