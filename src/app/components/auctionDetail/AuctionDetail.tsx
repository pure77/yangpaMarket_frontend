import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Home, Share2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { getMinutesUntilStart, getRemainingMinutes, useAuctions } from "../../hooks/useAuctions";
import { formatPrice, formatTimeAgo, formatTimeLeftSmart } from "../../utils/format";
import { useAuctionRealtime } from "../../hooks/useAuctionRealtime";
import { readMinimumBid } from "../../repositories/apiError";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

export function AuctionDetail() {
  const { auctionId = "" } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const {
    getAuctionById,
    getAuctionBids,
    placeBid,
    ensureAuctionLoaded,
    isAuctionLive,
    canManageAuction,
    deleteAuction,
  } = useAuctions();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  const [bidAmount, setBidAmount] = useState<number | "">("");
  const [errorMessage, setErrorMessage] = useState("");
  const [tick, setTick] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const BID_STEP = 10000; // 백엔드 minimumBidIncrement 기본값과 동일
  const { connectionStatus } = useAuctionRealtime(auctionId);

  const auction = getAuctionById(auctionId);
  const bidHistory = getAuctionBids(auctionId);
  const images = auction?.images ?? [];

  useEffect(() => {
    // 1초마다 tick을 갱신해 남은 시간 UI를 실시간으로 다시 계산합니다.
    const timer = window.setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void ensureAuctionLoaded(auctionId);
  }, [auctionId]);

  const remainingSeconds = useMemo(() => {
    if (!auction) {
      return 0;
    }
    return Math.max(0, Math.floor((new Date(auction.endAt).getTime() - Date.now()) / 1000));
  }, [auction, tick]);

  // 잘못된 ID 접근 시 목록으로 돌아갈 수 있게 안내 화면을 보여줍니다.
  if (!auction) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-[390px]">
          <p className="text-[16px] text-[#1A1A1A] mb-4">존재하지 않는 경매입니다.</p>
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

  // 종료 상태: 백엔드는 낙찰 시 PAYMENT_PENDING, 무입찰 종료 시 ENDED, 결제완료 시 PAID(isSold)
  const isEnded =
    !!auction &&
    (auction.status === "ENDED" || auction.status === "PAYMENT_PENDING" || auction.isSold);
  const isSeller = !!user && !!auction && auction.sellerId === user.id;
  const isWinner = !!user && !!auction && auction.winnerUserId === user.id;
  const minBid = auction ? auction.currentBid + BID_STEP : 0;

  const applyQuickBid = (delta: number) => {
    if (!auction) {
      return;
    }
    setBidAmount(auction.currentBid + delta);
  };

  const handleBid = async () => {
    // 비로그인 사용자는 인증 화면으로 유도합니다.
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    if (!auction || !isAuctionLive(auction)) {
      setErrorMessage("아직 공개되지 않았거나 종료된 경매입니다.");
      return;
    }
    if (isSeller) {
      setErrorMessage("본인 경매에는 입찰할 수 없습니다.");
      return;
    }
    const amount = typeof bidAmount === "number" ? bidAmount : 0;
    // 클라이언트 1차 검증(서버도 BID_TOO_LOW로 재검증)
    if (amount < minBid) {
      setErrorMessage(`최소 ${formatPrice(minBid)} 이상 입력해주세요.`);
      return;
    }

    setIsBidding(true);
    setErrorMessage("");
    try {
      const result = await placeBid(auction.id, amount);
      setBidAmount("");
      // 즉시구매가 이상이 되면 결제 화면으로 연결합니다.
      if (result.auction.buyNowPrice && result.auction.currentBid >= result.auction.buyNowPrice) {
        navigate(`/payment/${result.auction.id}`);
      }
    } catch (error) {
      // [거절 시 재시도를 확정으로] 서버가 유효 입찰가를 주면 입력창을 그 값으로 채운다.
      // 버튼은 누르지 않는다 — 입찰은 금전 행위라 항상 사용자가 확인하고 눌러야 한다.
      const minimum = readMinimumBid(error);
      if (minimum !== null) {
        setBidAmount(minimum);
        setErrorMessage(`가격이 올랐습니다. ${formatPrice(minimum)} 이상으로 다시 시도해주세요.`);
      } else {
        setErrorMessage(error instanceof Error ? error.message : "입찰 중 문제가 발생했습니다.");
      }
    } finally {
      setIsBidding(false);
    }
  };

  const isUnderOneHour = getRemainingMinutes(auction.endAt) < 60;
  const live = isAuctionLive(auction);
  // 아직 공개 전(예약 5분)이면 마감까지 남은 시간 대신 공개까지 남은 시간을 보여준다.
  const minutesUntilStart = getMinutesUntilStart(auction.startAt);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 상품 이미지/설명/입찰내역은 스크롤 영역에, 입찰 버튼은 하단 고정으로 배치합니다. */}
      <div className="sticky top-0 bg-white z-20 border-b border-[#E8E8E8]">
        <div className="max-w-[390px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-1" aria-label="뒤로가기">
              <ArrowLeft className="w-6 h-6 text-[#1A1A1A]" />
            </button>
            <button onClick={() => navigate("/auctions")} className="p-1" aria-label="홈으로">
              <Home className="w-6 h-6 text-[#1A1A1A]" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {canManageAuction(auction) && (
              <>
                <button
                  onClick={() => navigate(`/auctions/${auction.id}/edit`)}
                  className="text-[14px] font-medium text-[#1A1A1A] px-2"
                >
                  수정
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-[14px] font-medium text-[#FF3B30] px-2"
                >
                  삭제
                </button>
              </>
            )}
            <button className="p-1">
              <Share2 className="w-6 h-6 text-[#1A1A1A]" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-[390px] mx-auto">
          <div className="relative aspect-square bg-[#F5F5F5]">
            <ImageWithFallback
              src={images[currentImageIndex] ?? ""}
              alt={auction.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[12px] font-medium">
              {Math.min(currentImageIndex + 1, images.length)}/{images.length || 1}
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    index === currentImageIndex ? "bg-white w-4" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="px-4 py-5">
            <h1 className="text-[18px] font-bold text-[#1A1A1A] leading-tight mb-4">{auction.title}</h1>
            <div className="h-[1px] bg-[#E8E8E8] mb-4" />

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F5F5F5] rounded-full flex items-center justify-center">
                  <span className="text-[14px] font-medium text-[#888888]">
                    {auction.sellerName.slice(0, 1)}
                  </span>
                </div>
                <span className="text-[15px] font-medium text-[#1A1A1A]">{auction.sellerName}</span>
              </div>
              <button className="flex items-center gap-1 text-[14px] text-[#888888]">
                판매자 정보 보기
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#F5F5F5] rounded-[12px] p-4 grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-[12px] text-[#888888] mb-1">현재 입찰가</p>
                <p className="text-[18px] font-bold text-[#FF6F0F]">{formatPrice(auction.currentBid)}</p>
              </div>
              <div className="text-center border-l border-r border-white">
                <p className="text-[12px] text-[#888888] mb-1">입찰 횟수</p>
                <p className="text-[18px] font-bold text-[#1A1A1A]">{auction.bidCount}회</p>
              </div>
              <div className="text-center">
                <p className="text-[12px] text-[#888888] mb-1">
                  {isEnded ? "상태" : live ? "남은 시간" : "공개까지"}
                </p>
                {isEnded ? (
                  <p className="text-[16px] font-bold text-[#888888]">종료</p>
                ) : live ? (
                  <p className={`text-[16px] font-bold ${isUnderOneHour ? "text-[#FF3B30]" : "text-[#1A1A1A]"}`}>
                    {formatTimeLeftSmart(remainingSeconds)}
                  </p>
                ) : (
                  <p className="text-[16px] font-bold text-[#FF6F0F]">약 {minutesUntilStart}분 후</p>
                )}
              </div>
            </div>
          </div>

          <div className="h-2 bg-[#F5F5F5]" />

          <div className="px-4 py-5">
            <h2 className="text-[16px] font-bold text-[#1A1A1A] mb-3">상품 설명</h2>
            <div className="relative">
              <p
                className={`text-[15px] text-[#1A1A1A] leading-relaxed whitespace-pre-line ${
                  !showFullDescription ? "line-clamp-4" : ""
                }`}
              >
                {auction.description}
              </p>
              {!showFullDescription && (
                <button
                  onClick={() => setShowFullDescription(true)}
                  className="text-[14px] text-[#888888] mt-2 font-medium"
                >
                  더보기
                </button>
              )}
            </div>
          </div>

          <div className="h-2 bg-[#F5F5F5]" />

          <div className="px-4 py-5">
            <h2 className="text-[16px] font-bold text-[#1A1A1A] mb-4">입찰 내역</h2>
            <div className="space-y-3">
              {bidHistory.map((bid) => (
                <div
                  key={bid.id}
                  className={`flex items-center justify-between py-3 px-3 rounded-[8px] ${
                    bid.isHighest ? "bg-[#FFF4F0]" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F5F5F5] rounded-full flex items-center justify-center">
                      <span className="text-[12px] font-medium text-[#888888]">
                        {bid.bidderName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-[#1A1A1A]">{bid.bidderName}</p>
                      <p className="text-[12px] text-[#888888]">{formatTimeAgo(bid.createdAt)}</p>
                    </div>
                  </div>
                  <p className={`text-[16px] font-bold ${bid.isHighest ? "text-[#FF6F0F]" : "text-[#1A1A1A]"}`}>
                    {formatPrice(bid.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E8E8] z-10">
        <div className="max-w-[390px] mx-auto px-4 py-3">
          {/* 실시간 연결 상태 표시 */}
          <div className="flex items-center gap-1.5 mb-2">
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-[#22C55E]"
                  : connectionStatus === "connecting"
                    ? "bg-[#FFB020]"
                    : "bg-[#FF3B30]"
              }`}
            />
            <span className="text-[11px] text-[#888888]">
              {connectionStatus === "connected"
                ? "실시간 연결됨"
                : connectionStatus === "connecting"
                  ? "연결 중…"
                  : "연결 끊김 · 재연결 중"}
            </span>
          </div>

          {isEnded ? (
            // 종료: 최종가 + (낙찰자면) 결제 유도
            <div className="flex items-center justify-between gap-3">
              <div className="flex-shrink-0">
                <p className="text-[12px] text-[#888888] mb-0.5">최종가</p>
                <p className="text-[18px] font-bold text-[#1A1A1A]">{formatPrice(auction.currentBid)}</p>
              </div>
              {isWinner && !auction.isSold ? (
                <button
                  onClick={() => navigate(`/payment/${auction.id}`)}
                  className="h-12 px-6 bg-[#FF6F0F] text-white rounded-[8px] font-bold text-[16px] whitespace-nowrap"
                >
                  결제하기
                </button>
              ) : (
                <button
                  disabled
                  className="h-12 px-6 bg-[#E8E8E8] text-[#888888] rounded-[8px] font-bold text-[16px] whitespace-nowrap"
                >
                  {auction.isSold ? "결제 완료" : "경매 종료"}
                </button>
              )}
            </div>
          ) : (
            // 진행 중: 빠른 입찰 칩 + 직접 입력 + 입찰 버튼
            <>
              <div className="flex items-center gap-2 mb-2">
                {[10000, 50000, 100000].map((delta) => (
                  <button
                    key={delta}
                    onClick={() => applyQuickBid(delta)}
                    disabled={isSeller || !live}
                    className="flex-1 h-9 rounded-[8px] border border-[#E8E8E8] text-[13px] font-medium text-[#1A1A1A] disabled:opacity-50"
                  >
                    +{(delta / 10000).toLocaleString("ko-KR")}만
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={bidAmount}
                  onChange={(event) =>
                    setBidAmount(event.target.value === "" ? "" : Number(event.target.value))
                  }
                  placeholder={`${minBid.toLocaleString("ko-KR")} 이상`}
                  disabled={isSeller || !live}
                  className="flex-1 h-12 px-3 bg-[#F5F5F5] rounded-[8px] border-0 text-[15px] text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F] disabled:opacity-50"
                />
                <button
                  onClick={handleBid}
                  disabled={isBidding || isSeller || !live}
                  className="h-12 px-6 bg-[#FF6F0F] text-white rounded-[8px] font-bold text-[16px] whitespace-nowrap hover:bg-[#FF6F0F]/90 transition-colors disabled:opacity-50"
                >
                  {!live ? "곧 공개" : isSeller ? "내 경매" : "입찰하기"}
                </button>
              </div>
              <p className="text-[11px] text-[#888888] mt-1">
                즉시구매가 {auction.buyNowPrice ? formatPrice(auction.buyNowPrice) : "없음"}
              </p>
            </>
          )}
          {errorMessage && <p className="text-[12px] text-[#FF3B30] mt-2">{errorMessage}</p>}
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>경매를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              입찰자가 없는 경매만 삭제할 수 있어요. 삭제하면 목록에서 사라집니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={async () => {
                setIsDeleting(true);
                try {
                  await deleteAuction(auction.id);
                  navigate("/mypage/my-auctions", { replace: true });
                } catch (error) {
                  setErrorMessage(error instanceof Error ? error.message : "삭제에 실패했습니다.");
                } finally {
                  setIsDeleting(false);
                  setShowDeleteConfirm(false);
                }
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
