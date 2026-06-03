import type { PaymentMethod } from "../domain/types";
import { repositories } from "../repositories";
import { useAppSelector } from "../state/appStore";

export function usePayment() {
  const payments = useAppSelector((state) => state.payments);
  const sessionUser = useAppSelector((state) => state.session.user);
  // 결제는 로그인 사용자 기준으로 저장되며, 비로그인 시 게스트 ID를 사용합니다.
  const currentUserId = sessionUser?.id ?? "guest-user";

  const getOrderSummary = async (auctionId: string) => {
    return repositories.payment.getOrderSummary(auctionId);
  };

  const completePayment = async (auctionId: string, method: PaymentMethod) => {
    return repositories.payment.completePayment({
      auctionId,
      buyerId: currentUserId,
      method,
    });
  };

  const listMyPayments = async () => {
    return repositories.payment.listPayments(currentUserId);
  };

  // 결제 화면에서 필요한 조회/완료 API를 한 훅으로 묶어 제공합니다.
  return {
    payments,
    getOrderSummary,
    completePayment,
    listMyPayments,
  };
}
