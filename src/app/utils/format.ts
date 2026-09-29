/** 숫자를 한국어 가격 형식으로 변환 (예: 950000 → "950,000원") */
export function formatPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}

/**
 * 남은 분을 읽기 쉬운 텍스트로 변환.
 * - 0 이하: "마감"
 * - 60분 미만: "N분"
 * - 60분 이상~24시간 미만: "N시간 M분"
 * - 24시간 이상: "N일 M시간"
 */
export function formatTimeLeftMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) {
    return "마감";
  }
  // 24시간(1440분) 이상 남으면 일 단위로 표시한다.
  if (totalMinutes >= 1440) {
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    return hours === 0 ? `${days}일` : `${days}일 ${hours}시간`;
  }
  if (totalMinutes < 60) {
    return `${totalMinutes}분`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours}시간`;
  }
  return `${hours}시간 ${minutes}분`;
}

/**
 * 남은 시간을 상황에 맞게 표시한다.
 * - 24시간 이상: "N일 M시간" (일 단위)
 * - 24시간 미만: "HH:MM:SS" (초 단위 카운트다운)
 */
export function formatTimeLeftSmart(totalSeconds: number): string {
  const safe = Math.max(totalSeconds, 0);
  if (safe >= 86400) {
    const days = Math.floor(safe / 86400);
    const hours = Math.floor((safe % 86400) / 3600);
    return hours === 0 ? `${days}일` : `${days}일 ${hours}시간`;
  }
  return formatTimeLeftSeconds(safe);
}

/** 초를 "HH:MM:SS" 형식으로 변환 (경매 상세 카운트다운용) */
export function formatTimeLeftSeconds(totalSeconds: number): string {
  const safe = Math.max(totalSeconds, 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
    seconds,
  ).padStart(2, "0")}`;
}

/**
 * ISO 날짜 문자열을 "N분 전 / N시간 전 / N일 전" 형식으로 변환.
 * 입찰 히스토리, 경매 등록 시각 표시에 사용.
 */
export function formatTimeAgo(isoDateTime: string): string {
  const diffMs = Date.now() - new Date(isoDateTime).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (diffMinutes < 1) {
    return "방금 전";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
}
