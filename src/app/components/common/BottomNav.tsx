import { Heart, Home, List, Plus, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

type NavTab = "home" | "list" | "add" | "wishlist" | "mypage";

interface BottomNavProps {
  activeTab?: NavTab;
}

function getTabByPathname(pathname: string): NavTab {
  if (pathname.startsWith("/mypage/my-bids")) {
    return "wishlist";
  }
  if (pathname.startsWith("/mypage")) {
    return "mypage";
  }
  if (pathname.startsWith("/auctions/new")) {
    return "add";
  }
  return "home";
}

export function BottomNav({ activeTab }: BottomNavProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = activeTab ?? getTabByPathname(pathname);

  const handleMove = (path: string) => {
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E8E8] z-10">
      <div className="max-w-[390px] mx-auto flex items-center justify-around h-16">
        <button
          onClick={() => handleMove("/auctions")}
          className="flex flex-col items-center justify-center gap-1 flex-1"
        >
          <Home className={`w-6 h-6 ${current === "home" ? "text-[#FF6F0F]" : "text-[#888888]"}`} />
          <span
            className={`text-[11px] ${
              current === "home" ? "text-[#FF6F0F] font-medium" : "text-[#888888]"
            }`}
          >
            홈
          </span>
        </button>

        <button
          onClick={() => handleMove("/auctions")}
          className="flex flex-col items-center justify-center gap-1 flex-1"
        >
          <List className={`w-6 h-6 ${current === "list" ? "text-[#FF6F0F]" : "text-[#888888]"}`} />
          <span
            className={`text-[11px] ${
              current === "list" ? "text-[#FF6F0F] font-medium" : "text-[#888888]"
            }`}
          >
            경매목록
          </span>
        </button>

        <button
          onClick={() => handleMove("/auctions/new")}
          className="flex flex-col items-center justify-center gap-1 flex-1"
        >
          <div className="w-12 h-12 -mt-6 bg-[#FF6F0F] rounded-full flex items-center justify-center shadow-lg">
            <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[11px] text-[#FF6F0F] font-medium">등록하기</span>
        </button>

        <button
          onClick={() => handleMove("/mypage/my-bids")}
          className="flex flex-col items-center justify-center gap-1 flex-1"
        >
          <Heart className={`w-6 h-6 ${current === "wishlist" ? "text-[#FF6F0F]" : "text-[#888888]"}`} />
          <span
            className={`text-[11px] ${
              current === "wishlist" ? "text-[#FF6F0F] font-medium" : "text-[#888888]"
            }`}
          >
            관심목록
          </span>
        </button>

        <button
          onClick={() => handleMove("/mypage")}
          className="flex flex-col items-center justify-center gap-1 flex-1"
        >
          <User className={`w-6 h-6 ${current === "mypage" ? "text-[#FF6F0F]" : "text-[#888888]"}`} />
          <span
            className={`text-[11px] ${
              current === "mypage" ? "text-[#FF6F0F] font-medium" : "text-[#888888]"
            }`}
          >
            마이페이지
          </span>
        </button>
      </div>
    </div>
  );
}
