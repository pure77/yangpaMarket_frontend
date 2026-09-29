import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { AuctionEndedMessage, BidUpdateMessage } from "../domain/types";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

/** 경매 1건에 대한 실시간 수신 핸들러 묶음. */
export interface AuctionRealtimeHandlers {
  onBidUpdate: (msg: BidUpdateMessage) => void;
  onAuctionEnded: (msg: AuctionEndedMessage) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

interface AuctionEntry {
  handlers: Set<AuctionRealtimeHandlers>; // 같은 경매를 보는 구독자들(StrictMode 이중 마운트 대비)
  stompSub: StompSubscription | null;     // 실제 STOMP 구독(경매당 1개)
}

// 단일 STOMP 연결을 모든 경매 구독이 공유한다(앱 전역 싱글톤).
let client: Client | null = null;
let status: ConnectionStatus = "disconnected";
const entries = new Map<string, AuctionEntry>();

function topic(auctionId: string): string {
  return `/topic/auction/${auctionId}`;
}

function notifyStatus(next: ConnectionStatus): void {
  status = next;
  entries.forEach((entry) => entry.handlers.forEach((h) => h.onStatusChange?.(next)));
}

// 연결된 상태에서 아직 STOMP 구독이 없는 경매를 구독한다.
function subscribeTopic(auctionId: string): void {
  if (!client || !client.connected) {
    return;
  }
  const entry = entries.get(auctionId);
  if (!entry || entry.stompSub) {
    return;
  }
  entry.stompSub = client.subscribe(topic(auctionId), (frame: IMessage) => {
    let payload: BidUpdateMessage | AuctionEndedMessage;
    try {
      payload = JSON.parse(frame.body) as BidUpdateMessage | AuctionEndedMessage;
    } catch {
      return; // 잘못된 프레임은 무시(구독 콜백이 깨지지 않도록)
    }
    entry.handlers.forEach((h) => {
      if (payload.type === "BID_UPDATE") {
        h.onBidUpdate(payload);
      } else if (payload.type === "AUCTION_ENDED") {
        h.onAuctionEnded(payload);
      }
    });
  });
}

function ensureClient(): void {
  if (client) {
    return;
  }
  // 로컬 c로 인스턴스를 캡처해, 비활성화 후 새로 만든 클라이언트와의 레이스에서
  // "오래된 클라이언트"의 콜백이 현재 상태(entries/status)를 건드리지 못하게 가드한다.
  const c: Client = new Client({
    webSocketFactory: () => new SockJS("/ws"),
    reconnectDelay: 3000, // 끊기면 3초 후 자동 재연결
    onConnect: () => {
      if (c !== client) {
        return; // 이미 교체된 오래된 클라이언트의 이벤트는 무시
      }
      notifyStatus("connected");
      // (재)연결 시 등록된 모든 경매를 다시 구독
      entries.forEach((_entry, auctionId) => subscribeTopic(auctionId));
    },
    onWebSocketClose: () => {
      if (c !== client) {
        return; // 오래된 클라이언트의 close가 현재 entries의 구독을 무효화하지 않도록
      }
      // 끊기면 기존 STOMP 구독 핸들은 무효 → 재연결 시 새로 구독하도록 비운다.
      entries.forEach((entry) => {
        entry.stompSub = null;
      });
      notifyStatus("disconnected");
    },
    onStompError: () => {
      if (c !== client) {
        return;
      }
      notifyStatus("disconnected");
    },
  });
  client = c;
  notifyStatus("connecting");
  c.activate();
}

/**
 * 경매 실시간 구독. 반환된 함수를 호출하면 구독 해제된다.
 * 같은 auctionId를 여러 번 구독해도 STOMP 구독은 1개만 유지하고 핸들러만 누적한다.
 * 마지막 구독이 해제되면 STOMP 구독을, 전체가 0이면 연결을 정리한다.
 */
export function subscribeAuction(auctionId: string, handlers: AuctionRealtimeHandlers): () => void {
  ensureClient();

  let entry = entries.get(auctionId);
  if (!entry) {
    entry = { handlers: new Set(), stompSub: null };
    entries.set(auctionId, entry);
  }
  entry.handlers.add(handlers);
  handlers.onStatusChange?.(status); // 현재 상태 즉시 통지
  subscribeTopic(auctionId);         // 이미 연결돼 있으면 즉시 구독

  return () => {
    const current = entries.get(auctionId);
    if (!current) {
      return;
    }
    current.handlers.delete(handlers);
    if (current.handlers.size === 0) {
      current.stompSub?.unsubscribe();
      entries.delete(auctionId);
      if (entries.size === 0 && client) {
        void client.deactivate();
        client = null;
        status = "disconnected";
      }
    }
  };
}
