import type { Auction, CreateAuctionInput, UpdateAuctionInput } from "../domain/types";
import { repositories } from "../repositories";
import { getAppState, setAppState, useAppSelector } from "../state/appStore";

const guestUser = {
  id: "guest-user",
  nickname: "게스트",
  email: "",
  phone: "",
};

export function getRemainingMinutes(endAt: string): number {
  // 홈/상세에서 공통으로 사용하는 남은 시간 계산 유틸입니다.
  const diff = new Date(endAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 60_000));
}

export function getMinutesUntilStart(startAt: string): number {
  // 공개 예정 시각까지 남은 분(올림). 이미 공개됐으면 0.
  const diff = new Date(startAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 60_000));
}

export function useAuctions() {
  // 경매/입찰 데이터는 스토어 구독으로 가져와 화면과 즉시 동기화합니다.
  const auctions = useAppSelector((state) => state.auctions);
  const bids = useAppSelector((state) => state.bids);
  const sessionUser = useAppSelector((state) => state.session.user);
  // 비로그인 상태에서도 목록/상세를 보게 하기 위해 게스트 정보를 기본값으로 둡니다.
  const currentUser = sessionUser ?? guestUser;

  const getAuctionById = (auctionId: string) => {
    return auctions.find((item) => item.id === auctionId) ?? null;
  };

  const getAuctionBids = (auctionId: string) => {
    return bids
      .filter((item) => item.auctionId === auctionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const refreshAuctions = async () => {
    const serverAuctions = await repositories.auction.listAuctions();
    setAppState((prev) => ({ ...prev, auctions: serverAuctions }));
    return serverAuctions;
  };

  const ensureAuctionLoaded = async (auctionId: string) => {
    // 스토어에 이미 있으면 서버 요청 없이 재사용 (상세 화면 진입 최적화)
    const existing = getAppState().auctions.find((item) => item.id === auctionId);
    if (existing) return existing;
    const fetched = await repositories.auction.getAuctionById(auctionId);
    if (fetched) {
      // 기존 목록에서 같은 id를 제거하고 최신 데이터로 교체
      setAppState((prev) => ({
        ...prev,
        auctions: [fetched, ...prev.auctions.filter((item) => item.id !== fetched.id)],
      }));
    }
    return fetched;
  };

  const createAuction = async (input: CreateAuctionInput) => {
    const created = await repositories.auction.createAuction(input, currentUser);
    setAppState((prev) => ({
      ...prev,
      auctions: [created, ...prev.auctions.filter((item) => item.id !== created.id)],
    }));
    return created;
  };

  const updateAuction = async (auctionId: string, input: UpdateAuctionInput) => {
    const updated = await repositories.auction.updateAuction(auctionId, input);
    setAppState((prev) => ({
      ...prev,
      auctions: prev.auctions.map((item) => (item.id === auctionId ? updated : item)),
    }));
    return updated;
  };

  const deleteAuction = async (auctionId: string) => {
    await repositories.auction.deleteAuction(auctionId);
    setAppState((prev) => ({
      ...prev,
      auctions: prev.auctions.filter((item) => item.id !== auctionId),
    }));
  };

  // ACTIVE 상태이고 공개 시각(startAt)이 지난 경매만 라이브로 판단
  const isAuctionLive = (auction: Auction) => {
    return auction.status === "ACTIVE" && new Date(auction.startAt).getTime() <= Date.now();
  };

  // 본인 경매이면서 입찰 0건 + ACTIVE일 때만 수정/삭제 버튼 노출
  const canManageAuction = (auction: Auction) => {
    return (
      !!sessionUser &&
      auction.sellerId === sessionUser.id &&
      auction.bidCount === 0 &&
      auction.status === "ACTIVE"
    );
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
    // 현재 정책은 1만원 단위 자동 증가 제안입니다.
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
    updateAuction,
    deleteAuction,
    refreshAuctions,
    ensureAuctionLoaded,
    isAuctionLive,
    canManageAuction,
    placeBid,
    getSuggestedNextBid,
    listMySellingAuctions,
    listMyBiddingAuctions,
    listMyWinningAuctions,
  };
}
