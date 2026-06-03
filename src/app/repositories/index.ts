import { httpRepository } from "./httpRepository";
import { mockRepository } from "./mockRepository";

// 현재 모드: 경매/결제는 mock, 인증은 실제 http 연동을 사용합니다.
// API 전환 시 이 매핑만 바꾸면 hooks/컴포넌트 코드는 그대로 유지됩니다.
export const repositories = {
  auction: mockRepository.auction,
  payment: mockRepository.payment,
  auth: httpRepository.auth,
};
