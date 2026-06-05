import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuctions } from "../../hooks/useAuctions";
import { formatPrice } from "../../utils/format";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import type { Auction } from "../../domain/types";

export function MyAuctions() {
  const navigate = useNavigate();
  const { listMySellingAuctions, canManageAuction, deleteAuction, isAuctionLive } = useAuctions();
  const [items, setItems] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      setItems(await listMySellingAuctions());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const statusLabel = (auction: Auction) => {
    if (auction.status === "CANCELLED") return "취소됨";
    if (!isAuctionLive(auction)) return "준비중";
    return "진행중";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 bg-white z-20 border-b border-[#E8E8E8]">
        <div className="max-w-[390px] mx-auto px-4 h-14 flex items-center justify-center relative">
          <button onClick={() => navigate("/mypage")} className="absolute left-4 p-1">
            <ArrowLeft className="w-6 h-6 text-[#1A1A1A]" />
          </button>
          <h1 className="text-[18px] font-semibold text-[#1A1A1A]">등록한 경매</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-[390px] mx-auto px-4 py-4 space-y-3">
          {loading && <p className="text-[14px] text-[#888888] text-center py-8">불러오는 중…</p>}
          {!loading && items.length === 0 && (
            <p className="text-[14px] text-[#888888] text-center py-8">등록한 경매가 없습니다.</p>
          )}
          {items.map((auction) => (
            <div
              key={auction.id}
              className="flex gap-3 border border-[#E8E8E8] rounded-[12px] p-3"
            >
              <button onClick={() => navigate(`/auctions/${auction.id}`)} className="flex-shrink-0">
                <ImageWithFallback
                  src={auction.images[0] ?? ""}
                  alt={auction.title}
                  className="w-20 h-20 object-cover rounded-[8px] bg-[#F5F5F5]"
                />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-medium text-[#888888] bg-[#F5F5F5] px-2 py-0.5 rounded">
                    {statusLabel(auction)}
                  </span>
                </div>
                <h3 className="text-[14px] font-medium text-[#1A1A1A] line-clamp-1">{auction.title}</h3>
                <p className="text-[15px] font-bold text-[#FF6F0F] mt-1">{formatPrice(auction.currentBid)}</p>
                {canManageAuction(auction) && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => navigate(`/auctions/${auction.id}/edit`)}
                      className="text-[13px] font-medium text-[#1A1A1A] border border-[#E8E8E8] rounded-[6px] px-3 py-1"
                    >
                      수정
                    </button>
                    <button
                      onClick={async () => {
                        await deleteAuction(auction.id);
                        await reload();
                      }}
                      className="text-[13px] font-medium text-[#FF3B30] border border-[#E8E8E8] rounded-[6px] px-3 py-1"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
