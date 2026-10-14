import { httpRepository } from "./httpRepository";
import { mockRepository } from "./mockRepository";

// 경매: CRUD/목록/입찰/입찰내역은 실제 http.
// 아직 http 미구현인 입찰중/낙찰/결제표시 3개만 mock으로 합성한다.
export const repositories = {
  auction: {
    ...httpRepository.auction,
    listBiddingAuctions: mockRepository.auction.listBiddingAuctions,
    listWinningAuctions: mockRepository.auction.listWinningAuctions,
    markAuctionPaid: mockRepository.auction.markAuctionPaid,
  },
  payment: mockRepository.payment,
  auth: httpRepository.auth,
};
