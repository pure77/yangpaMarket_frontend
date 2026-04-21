import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Heart, Share2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { getRemainingMinutes, useAuctions } from "../../hooks/useAuctions";
import { formatPrice, formatTimeAgo, formatTimeLeftSeconds } from "../../utils/format";
import { ImageWithFallback } from "../figma/ImageWithFallback";

export function AuctionDetail() {
  const { auctionId = "" } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getAuctionById, getAuctionBids, getSuggestedNextBid, placeBid } = useAuctions();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [tick, setTick] = useState(0);

  const auction = getAuctionById(auctionId);
  const bidHistory = getAuctionBids(auctionId);
  const images = auction?.images ?? [];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remainingSeconds = useMemo(() => {
    if (!auction) {
      return 0;
    }
    return Math.max(0, Math.floor((new Date(auction.endAt).getTime() - Date.now()) / 1000));
  }, [auction, tick]);

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

  const handleBid = async () => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    setIsBidding(true);
    setErrorMessage("");
    try {
      const nextBid = getSuggestedNextBid(auction.id);
      const result = await placeBid(auction.id, nextBid);
      if (result.auction.buyNowPrice && result.auction.currentBid >= result.auction.buyNowPrice) {
        navigate(`/payment/${result.auction.id}`);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "입찰 중 문제가 발생했습니다.");
    } finally {
      setIsBidding(false);
    }
  };

  const isUnderOneHour = getRemainingMinutes(auction.endAt) < 60;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 bg-white z-20 border-b border-[#E8E8E8]">
        <div className="max-w-[390px] mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-6 h-6 text-[#1A1A1A]" />
          </button>
          <button className="p-1">
            <Share2 className="w-6 h-6 text-[#1A1A1A]" />
          </button>
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
                <p className="text-[12px] text-[#888888] mb-1">남은 시간</p>
                <p className={`text-[16px] font-bold ${isUnderOneHour ? "text-[#FF3B30]" : "text-[#1A1A1A]"}`}>
                  {formatTimeLeftSeconds(remainingSeconds)}
                </p>
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
              {bidHistory.map((bid, index) => (
                <div
                  key={bid.id}
                  className={`flex items-center justify-between py-3 px-3 rounded-[8px] ${
                    index === 0 ? "bg-[#FFF4F0]" : "bg-white"
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
                  <p className={`text-[16px] font-bold ${index === 0 ? "text-[#FF6F0F]" : "text-[#1A1A1A]"}`}>
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
          <div className="flex items-center justify-between gap-3">
            <div className="flex-shrink-0">
              <p className="text-[12px] text-[#888888] mb-0.5">현재가</p>
              <p className="text-[18px] font-bold text-[#1A1A1A]">{formatPrice(auction.currentBid)}</p>
              <p className="text-[11px] text-[#888888] mt-0.5">
                즉시구매가 {auction.buyNowPrice ? formatPrice(auction.buyNowPrice) : "없음"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-12 h-12 border border-[#E8E8E8] rounded-[8px] flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-[#888888]" />
              </button>
              <button
                onClick={handleBid}
                disabled={isBidding || auction.isSold}
                className="h-12 px-6 bg-[#FF6F0F] text-white rounded-[8px] font-bold text-[16px] whitespace-nowrap hover:bg-[#FF6F0F]/90 transition-colors disabled:opacity-50"
              >
                {auction.isSold ? "결제 완료" : "입찰하기"}
              </button>
            </div>
          </div>
          {errorMessage && <p className="text-[12px] text-[#FF3B30] mt-2">{errorMessage}</p>}
        </div>
      </div>
    </div>
  );
}
