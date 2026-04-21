import type { CreateAuctionInput } from "../domain/types";
import { repositories } from "../repositories";
import { useAppSelector } from "../state/appStore";

const guestUser = {
  id: "guest-user",
  nickname: "게스트",
  email: "",
  phone: "",
};

export function getRemainingMinutes(endAt: string): number {
  const diff = new Date(endAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 60_000));
}

export function useAuctions() {
  const auctions = useAppSelector((state) => state.auctions);
  const bids = useAppSelector((state) => state.bids);
  const sessionUser = useAppSelector((state) => state.session.user);
  const currentUser = sessionUser ?? guestUser;

  const getAuctionById = (auctionId: string) => {
    return auctions.find((item) => item.id === auctionId) ?? null;
  };

  const getAuctionBids = (auctionId: string) => {
    return bids
      .filter((item) => item.auctionId === auctionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const createAuction = async (input: CreateAuctionInput) => {
    return repositories.auction.createAuction(input, currentUser);
  };

  const placeBid = async (auctionId: string, amount: number) => {
    return repositories.auction.placeBid({
      auctionId,
      amount,
      bidderId: currentUser.id,
      bidderName: currentUser.nickname,
    });
  };

  const getSuggestedNextBid = (auctionId: string) => {
    const auction = getAuctionById(auctionId);
    if (!auction) {
      return 0;
    }
    return auction.currentBid + 10000;
  };

  const listMySellingAuctions = async () => {
    if (!sessionUser) {
      return [];
    }
    return repositories.auction.listAuctionsBySeller(sessionUser.id);
  };

  const listMyBiddingAuctions = async () => {
    if (!sessionUser) {
      return [];
    }
    return repositories.auction.listBiddingAuctions(sessionUser.id);
  };

  const listMyWinningAuctions = async () => {
    if (!sessionUser) {
      return [];
    }
    return repositories.auction.listWinningAuctions(sessionUser.id);
  };

  return {
    auctions,
    bids,
    getAuctionById,
    getAuctionBids,
    createAuction,
    placeBid,
    getSuggestedNextBid,
    listMySellingAuctions,
    listMyBiddingAuctions,
    listMyWinningAuctions,
  };
}
