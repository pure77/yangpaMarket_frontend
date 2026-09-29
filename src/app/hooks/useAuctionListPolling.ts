import { useEffect, useRef } from "react";

/**
 * 화면이 보일 때만 주기적으로 refresh를 호출하는 폴링 훅.
 * - 백그라운드 탭이면 타이머를 멈추고, 복귀 시 즉시 1회 갱신 후 재개한다.
 * - refresh는 ref로 보관해 매 렌더마다 타이머가 재설정되지 않게 한다.
 */
export function useAuctionListPolling(refresh: () => void | Promise<void>, intervalMs = 5000): void {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    let timer: number | undefined;

    const tick = () => {
      if (document.visibilityState === "visible") {
        void refreshRef.current();
      }
    };
    const start = () => {
      if (timer === undefined) {
        timer = window.setInterval(tick, intervalMs);
      }
    };
    const stop = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshRef.current();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") {
      start();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);
}
