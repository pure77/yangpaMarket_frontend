/**
 * 서버 에러의 부가 정보를 읽는 자리.
 *
 * [왜 따로 두나] HttpApiError.data는 unknown이다. 좁히는 코드를 컴포넌트마다 흩뿌리면
 * 서버가 형태를 바꿀 때 고칠 곳이 여러 군데가 된다. 여기 한 곳만 고치면 되게 모아둔다.
 * 의존성이 없는 순수 함수라 나중에 테스트 러너가 들어오면 그대로 테스트할 수 있다.
 */

/**
 * BID_TOO_LOW 응답에서 "이 금액 이상이면 통과"인 값을 꺼낸다.
 * 형태가 맞지 않으면 null을 돌려주고, 호출자는 일반 에러 처리로 넘어간다.
 */
export function readMinimumBid(error: unknown): number | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }
  const code = (error as { code?: unknown }).code;
  if (code !== "BID_TOO_LOW") {
    return null;
  }
  const data = (error as { data?: unknown }).data;
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const minimumBid = (data as { minimumBid?: unknown }).minimumBid;
  return typeof minimumBid === "number" && Number.isFinite(minimumBid) ? minimumBid : null;
}
