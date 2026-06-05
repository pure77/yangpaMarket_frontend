import { httpRepository } from "./httpRepository";
import { mockRepository } from "./mockRepository";

// 경매: CRUD/목록은 실제 http, 입찰/결제 데모 흐름은 mock 위임(composition).
// auth는 http 유지, payment는 mock 유지.
export const repositories = {
  auction: {
    ...mockRepository.auction,
    ...httpRepository.auction,
  },
  payment: mockRepository.payment,
  auth: httpRepository.auth,
};
