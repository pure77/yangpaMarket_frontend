import type { PaymentMethod } from "../domain/types";
import { repositories } from "../repositories";
import { useAppSelector } from "../state/appStore";

export function usePayment() {
  const payments = useAppSelector((state) => state.payments);
  const sessionUser = useAppSelector((state) => state.session.user);
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

  return {
    payments,
    getOrderSummary,
    completePayment,
    listMyPayments,
  };
}
