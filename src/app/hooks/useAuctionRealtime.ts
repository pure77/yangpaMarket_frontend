import { useEffect, useRef, useState } from "react";
import type { AuctionEndedMessage, Bid, BidUpdateMessage } from "../domain/types";
import { repositories } from "../repositories";
import { subscribeAuction, type ConnectionStatus } from "../repositories/realtimeClient";
import { setAppState } from "../state/appStore";

/**
 * 경매 상세 화면용 실시간 구독 훅.
 * - 마운트 시 /topic/auction/{id} 구독, 언마운트 시 해제.
 * - BID_UPDATE/AUCTION_ENDED를 전역 스토어에 반영.
 * - (재)연결 시 상세+입찰내역을 1회 재조회해 끊긴 동안의 변화를 메운다(갭 보정).
 */
export function useAuctionRealtime(auctionId: string): { connectionStatus: ConnectionStatus } {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const lastStatusRef = useRef<ConnectionStatus>("disconnected");

  useEffect(() => {
    if (!auctionId) {
      return;
    }

    // 연결 직후 호출: 상세(현재가/상태/낙찰자) + 입찰내역을 최신화
    const resync = async () => {
      const fresh = await repositories.auction.getAuctionById(auctionId);
      if (fresh) {
        setAppState((prev) => ({
          ...prev,
          auctions: prev.auctions.some((a) => a.id === auctionId)
            ? prev.auctions.map((a) => (a.id === auctionId ? fresh : a))
            : [fresh, ...prev.auctions],
        }));
      }
      const serverBids = await repositories.auction.listAuctionBids(auctionId);
      setAppState((prev) => ({
        ...prev,
        bids: [...serverBids, ...prev.bids.filter((b) => b.auctionId !== auctionId)],
      }));
    };

    const unsubscribe = subscribeAuction(auctionId, {
      onStatusChange: (next) => {
        setConnectionStatus(next);
        if (next === "connected" && lastStatusRef.current !== "connected") {
          void resync(); // disconnected → connected 전이(최초 연결 포함)에서만 보정
        }
        lastStatusRef.current = next;
      },
      onBidUpdate: (msg: BidUpdateMessage) => {
        setAppState((prev) => {
          const newBid: Bid = {
            id: `${auctionId}-ws-${Date.now()}`,
            auctionId,
            bidderId: "",
            bidderName: msg.maskedBidder,
            amount: msg.currentPrice,
            createdAt: new Date().toISOString(),
            isHighest: true,
          };
          return {
            ...prev,
            auctions: prev.auctions.map((a) =>
              a.id === auctionId ? { ...a, currentBid: msg.currentPrice, bidCount: msg.bidCount } : a,
            ),
            bids: [
              newBid,
              ...prev.bids.map((b) => (b.auctionId === auctionId ? { ...b, isHighest: false } : b)),
            ],
          };
        });
      },
      onAuctionEnded: (msg: AuctionEndedMessage) => {
        setAppState((prev) => ({
          ...prev,
          auctions: prev.auctions.map((a) =>
            a.id === auctionId
              ? {
                  ...a,
                  currentBid: msg.finalPrice,
                  winnerUserId: msg.winnerId,
                  // 메시지엔 status가 없으므로 백엔드 close() 규칙을 winnerId 유무로 추론
                  status: msg.winnerId ? "PAYMENT_PENDING" : "ENDED",
                }
              : a,
          ),
        }));
      },
    });

    return unsubscribe;
  }, [auctionId]);

  return { connectionStatus };
}
