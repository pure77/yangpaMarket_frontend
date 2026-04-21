import { useMemo, useState } from "react";
import { Bell, Clock, Search, User } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuctions, getRemainingMinutes } from "../../hooks/useAuctions";
import { formatPrice, formatTimeLeftMinutes } from "../../utils/format";
import { BottomNav } from "../common/BottomNav";
import { ImageWithFallback } from "../figma/ImageWithFallback";

type Category = "전체" | "전자기기" | "패션" | "생활/가전" | "수집품" | "스포츠";

const categories: Category[] = ["전체", "전자기기", "패션", "생활/가전", "수집품", "스포츠"];

export function AuctionHome() {
  const navigate = useNavigate();
  const { auctions } = useAuctions();
  const [activeCategory, setActiveCategory] = useState<Category>("전체");
  const [query, setQuery] = useState("");

  const filteredAuctions = useMemo(() => {
    return auctions.filter((item) => {
      const byCategory = activeCategory === "전체" || item.category === activeCategory;
      const normalizedQuery = query.trim().toLowerCase();
      const byQuery =
        normalizedQuery.length === 0 ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery);
      return byCategory && byQuery;
    });
  }, [activeCategory, auctions, query]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 bg-white border-b border-[#E8E8E8] z-10">
        <div className="max-w-[390px] mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-[18px] font-semibold text-[#1A1A1A]">경매마켓</h1>
          <div className="flex items-center gap-3">
            <button
              className="relative"
              onClick={() => navigate("/mypage/notifications")}
              aria-label="알림 설정"
            >
              <Bell className="w-6 h-6 text-[#1A1A1A]" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF6F0F] rounded-full" />
            </button>
            <button
              className="w-8 h-8 bg-[#F5F5F5] rounded-full flex items-center justify-center"
              onClick={() => navigate("/mypage")}
              aria-label="마이페이지"
            >
              <User className="w-4 h-4 text-[#888888]" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-[390px] mx-auto px-4">
          <div className="py-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
              <input
                type="text"
                placeholder="어떤 물건을 찾고 계세요?"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-[#F5F5F5] rounded-full border-0 text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F] text-[15px]"
              />
            </div>
          </div>

          <div className="pb-4 -mx-4 px-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`flex-shrink-0 h-9 px-4 rounded-full text-[14px] font-medium transition-colors whitespace-nowrap ${
                    activeCategory === category
                      ? "bg-[#FF6F0F] text-white"
                      : "bg-white text-[#1A1A1A] border border-[#E8E8E8]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-4">
            <h2 className="text-[18px] font-semibold text-[#1A1A1A]">지금 진행 중인 경매</h2>
            <button className="text-[14px] text-[#888888]" onClick={() => setActiveCategory("전체")}>
              전체보기 &gt;
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-6">
            {filteredAuctions.map((item) => {
              const remainingMinutes = getRemainingMinutes(item.endAt);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/auctions/${item.id}`)}
                  className="text-left bg-white border border-[#E8E8E8] rounded-[12px] overflow-hidden"
                >
                  <div className="relative aspect-[4/3] bg-[#F5F5F5]">
                    <ImageWithFallback
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[11px] font-medium text-[#1A1A1A]">
                      {item.category}
                    </div>
                    <div
                      className={`absolute bottom-2 right-2 px-2 py-1 rounded flex items-center gap-1 text-[11px] font-medium text-white ${
                        remainingMinutes < 60 ? "bg-[#FF3B30]" : "bg-black/60 backdrop-blur-sm"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {formatTimeLeftMinutes(remainingMinutes)}
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="text-[14px] font-medium text-[#1A1A1A] line-clamp-2 mb-2 leading-tight">
                      {item.title}
                    </h3>
                    <div>
                      <p className="text-[16px] font-semibold text-[#FF6F0F]">
                        {formatPrice(item.currentBid)}
                      </p>
                      <p className="text-[12px] text-[#888888] mt-0.5">입찰 {item.bidCount}회</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav activeTab="home" />

      <style>
        {`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
    </div>
  );
}
