import { useEffect, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import type { PaymentMethod as PaymentMethodType } from "../../domain/types";
import { useAuth } from "../../hooks/useAuth";
import { usePayment } from "../../hooks/usePayment";
import { formatPrice } from "../../utils/format";
import { ImageWithFallback } from "../figma/ImageWithFallback";

type PaymentMethod = PaymentMethodType;

export function Payment() {
  const { auctionId = "" } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getOrderSummary, completePayment } = usePayment();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("kakaopay");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSummary, setOrderSummary] = useState<Awaited<ReturnType<typeof getOrderSummary>>>(null);

  const [cardInfo, setCardInfo] = useState({
    number1: "",
    number2: "",
    number3: "",
    number4: "",
    expiry: "",
    cvc: "",
    holder: "",
  });

  useEffect(() => {
    void (async () => {
      const summary = await getOrderSummary(auctionId);
      setOrderSummary(summary);
    })();
  }, [auctionId]);

  const paymentMethods = [
    {
      id: "kakaopay" as PaymentMethod,
      name: "카카오페이",
      logo: (
        <div className="w-8 h-8 bg-[#FEE500] rounded flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 3C5.58172 3 2 5.89543 2 9.5C2 11.6484 3.28516 13.5312 5.26172 14.668L4.38281 17.8945C4.32031 18.1133 4.56641 18.2891 4.75391 18.168L8.60156 15.7188C9.05469 15.7773 9.52344 15.8125 10 15.8125C14.4183 15.8125 18 12.9141 18 9.3125C18 5.71094 14.4183 3 10 3Z"
              fill="#1A1A1A"
            />
          </svg>
        </div>
      ),
    },
    {
      id: "tosspay" as PaymentMethod,
      name: "토스페이",
      logo: (
        <div className="w-8 h-8 bg-[#0064FF] rounded flex items-center justify-center">
          <span className="text-white text-[14px] font-bold">T</span>
        </div>
      ),
    },
    {
      id: "card" as PaymentMethod,
      name: "신용/체크카드",
      logo: (
        <div className="w-8 h-8 bg-[#F5F5F5] rounded flex items-center justify-center">
          <span className="text-[20px]">💳</span>
        </div>
      ),
    },
    {
      id: "bank" as PaymentMethod,
      name: "계좌이체",
      logo: (
        <div className="w-8 h-8 bg-[#F5F5F5] rounded flex items-center justify-center">
          <span className="text-[20px]">🏦</span>
        </div>
      ),
    },
  ];

  const handlePayment = async () => {
    if (!orderSummary) {
      setErrorMessage("결제 정보를 불러오지 못했습니다.");
      return;
    }
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage("결제 진행에 동의해주세요.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const payment = await completePayment(auctionId, selectedMethod);
      if (!payment) {
        setErrorMessage("결제 처리 중 문제가 발생했습니다.");
        return;
      }
      setShowSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setShowCardDetails(method === "card");
  };

  if (!orderSummary) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-[390px]">
          <p className="text-[16px] text-[#1A1A1A] mb-4">결제 가능한 경매 정보를 찾지 못했습니다.</p>
          <button
            onClick={() => navigate("/auctions")}
            className="w-full h-12 bg-[#FF6F0F] text-white rounded-[8px] font-medium"
          >
            경매 목록으로
          </button>
        </div>
      </div>
    );
  }

  const orderDetails = {
    productImage: orderSummary.auction.images[0],
    productTitle: orderSummary.auction.title,
    seller: orderSummary.auction.sellerName,
    winningBid: orderSummary.amount,
    fee: orderSummary.fee,
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-[390px] w-full px-4">
          <div className="text-center">
            <div className="w-24 h-24 bg-[#FF6F0F] rounded-full flex items-center justify-center mx-auto mb-6 animate-scale">
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </div>

            <h1 className="text-[24px] font-bold text-[#1A1A1A] mb-2">낙찰을 축하드립니다!</h1>
            <p className="text-[15px] text-[#888888] mb-8">결제가 완료되었습니다</p>

            <div className="bg-[#F5F5F5] rounded-[12px] p-5 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <ImageWithFallback
                  src={orderDetails.productImage}
                  alt={orderDetails.productTitle}
                  className="w-16 h-16 object-cover rounded-[8px]"
                />
                <div className="flex-1 text-left">
                  <p className="text-[14px] font-medium text-[#1A1A1A] mb-1">{orderDetails.productTitle}</p>
                  <p className="text-[13px] text-[#888888]">{orderDetails.seller}</p>
                </div>
              </div>
              <div className="h-[1px] bg-white mb-3" />
              <div className="flex justify-between items-center">
                <span className="text-[14px] text-[#888888]">결제 금액</span>
                <span className="text-[20px] font-bold text-[#FF6F0F]">
                  {formatPrice(orderSummary.totalAmount)}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/mypage/my-wins")}
              className="w-full h-[52px] bg-[#FF6F0F] text-white rounded-[8px] font-bold text-[16px] hover:bg-[#FF6F0F]/90 transition-colors"
            >
              확인
            </button>
          </div>
        </div>

        <style>{`
          @keyframes scale {
            0% {
              transform: scale(0);
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
            }
          }
          .animate-scale {
            animation: scale 0.5s ease-out;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 bg-white z-10 border-b border-[#E8E8E8]">
        <div className="max-w-[390px] mx-auto px-4 h-14 flex items-center justify-center relative">
          <button onClick={() => navigate(-1)} className="absolute left-4 p-1">
            <ArrowLeft className="w-6 h-6 text-[#1A1A1A]" />
          </button>
          <h1 className="text-[18px] font-semibold text-[#1A1A1A]">결제하기</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-[390px] mx-auto px-4 py-6">
          <div className="border border-[#E8E8E8] rounded-[12px] p-4 mb-6">
            <div className="flex gap-3 mb-4">
              <ImageWithFallback
                src={orderDetails.productImage}
                alt={orderDetails.productTitle}
                className="w-[60px] h-[60px] object-cover rounded-[8px] flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-[#1A1A1A] mb-1 line-clamp-2">
                  {orderDetails.productTitle}
                </p>
                <p className="text-[13px] text-[#888888]">{orderDetails.seller}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-[13px] text-[#888888] mb-1">낙찰가</p>
              <p className="text-[22px] font-bold text-[#FF6F0F]">{formatPrice(orderDetails.winningBid)}</p>
            </div>

            <div className="h-[1px] bg-[#E8E8E8] mb-3" />

            <div className="space-y-2">
              <div className="flex justify-between text-[14px]">
                <span className="text-[#888888]">낙찰가</span>
                <span className="text-[#1A1A1A]">{formatPrice(orderDetails.winningBid)}</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-[#888888]">수수료 (3%)</span>
                <span className="text-[#1A1A1A]">{formatPrice(orderDetails.fee)}</span>
              </div>
              <div className="h-[1px] bg-[#E8E8E8] my-2" />
              <div className="flex justify-between text-[16px]">
                <span className="font-bold text-[#1A1A1A]">최종 결제금액</span>
                <span className="font-bold text-[#1A1A1A]">{formatPrice(orderSummary.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-[16px] font-bold text-[#1A1A1A] mb-3">결제 수단</h2>
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id)}
                  className={`w-full p-4 rounded-[8px] border flex items-center gap-3 transition-colors ${
                    selectedMethod === method.id ? "bg-[#FFF4F0] border-[#FF6F0F]" : "bg-white border-[#E8E8E8]"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors border-[#E8E8E8]">
                    {selectedMethod === method.id && <div className="w-3 h-3 bg-[#FF6F0F] rounded-full" />}
                  </div>
                  {method.logo}
                  <span className="text-[16px] text-[#1A1A1A]">{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          {showCardDetails && (
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">카드번호</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={4}
                      placeholder="0000"
                      value={cardInfo[`number${i}` as keyof typeof cardInfo]}
                      onChange={(event) =>
                        setCardInfo({
                          ...cardInfo,
                          [`number${i}`]: event.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="flex-1 h-12 px-3 bg-[#F5F5F5] rounded-[8px] border-0 text-center text-[16px] text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F]"
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">유효기간 (MM/YY)</label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="MM/YY"
                    value={cardInfo.expiry}
                    onChange={(event) => {
                      let value = event.target.value.replace(/\D/g, "");
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + "/" + value.slice(2, 4);
                      }
                      setCardInfo({ ...cardInfo, expiry: value });
                    }}
                    className="w-full h-12 px-3 bg-[#F5F5F5] rounded-[8px] border-0 text-[16px] text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F]"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">CVC</label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="000"
                    value={cardInfo.cvc}
                    onChange={(event) => setCardInfo({ ...cardInfo, cvc: event.target.value.replace(/\D/g, "") })}
                    className="w-full h-12 px-3 bg-[#F5F5F5] rounded-[8px] border-0 text-[16px] text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">카드 소유자명</label>
                <input
                  type="text"
                  placeholder="카드에 표시된 이름"
                  value={cardInfo.holder}
                  onChange={(event) => setCardInfo({ ...cardInfo, holder: event.target.value })}
                  className="w-full h-12 px-3 bg-[#F5F5F5] rounded-[8px] border-0 text-[16px] text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F]"
                />
              </div>
            </div>
          )}

          <div className="bg-[#F5F5F5] rounded-[8px] p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(event) => setAgreedToTerms(event.target.checked)}
                  className="w-5 h-5 rounded border-2 border-[#888888] appearance-none checked:bg-[#FF6F0F] checked:border-[#FF6F0F] cursor-pointer"
                />
                {agreedToTerms && (
                  <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                )}
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-[15px] text-[#1A1A1A]">결제 진행에 동의합니다</span>
                <button className="text-[13px] text-[#888888] underline">자세히</button>
              </div>
            </label>
          </div>
          {errorMessage && <p className="text-[12px] text-[#FF3B30] mt-2">{errorMessage}</p>}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E8E8] z-10">
        <div className="max-w-[390px] mx-auto px-4 py-3">
          <button
            onClick={handlePayment}
            disabled={!agreedToTerms || isSubmitting}
            className="w-full h-[52px] bg-[#FF6F0F] text-white rounded-[8px] font-bold text-[16px] hover:bg-[#FF6F0F]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "결제 처리 중..." : `결제하기 ${formatPrice(orderSummary.totalAmount)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
