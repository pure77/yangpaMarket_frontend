import { createBrowserRouter, redirect } from "react-router";
import { AuctionDetail } from "./components/auctionDetail/AuctionDetail";
import { AuctionHome } from "./components/auctionHome/AuctionHome";
import { AuctionRegister } from "./components/auctionRegister/AuctionRegister";
import { PlaceholderPage } from "./components/common/PlaceholderPage";
import { AuthScreen } from "./components/login/AuthScreen";
import { MyPage } from "./components/myPage/MyPage";
import { Payment } from "./components/payment/Payment";

function MyAuctionsPage() {
  return (
    <PlaceholderPage
      title="등록한 경매"
      description="내가 등록한 경매 목록 화면입니다. 1차에서는 라우팅과 흐름 연결까지 제공합니다."
    />
  );
}

function MyBidsPage() {
  return (
    <PlaceholderPage
      title="입찰 중인 경매"
      description="현재 입찰 참여 중인 경매 화면입니다. 1차에서는 경로 연결과 네비게이션을 제공합니다."
    />
  );
}

function MyWinsPage() {
  return (
    <PlaceholderPage
      title="낙찰된 경매"
      description="낙찰된 경매 내역 화면입니다. 결제 완료 후 이 경로로 연결할 수 있도록 준비되어 있습니다."
    />
  );
}

function MySalesPage() {
  return (
    <PlaceholderPage
      title="판매 완료"
      description="판매 완료 내역 화면입니다. 1차에서는 디자인 톤을 유지한 placeholder로 연결합니다."
    />
  );
}

function PaymentHistoryPage() {
  return (
    <PlaceholderPage
      title="결제 내역"
      description="결제 이력 화면입니다. 결제 흐름과 경로 연결을 우선 제공하고, 상세 데이터는 다음 단계에서 확장합니다."
    />
  );
}

function SettlementHistoryPage() {
  return (
    <PlaceholderPage
      title="정산 내역"
      description="판매 정산 내역 화면입니다. 현재는 경로와 UX 흐름 단절을 제거하는 목적의 placeholder입니다."
    />
  );
}

function NotificationsPage() {
  return (
    <PlaceholderPage
      title="알림 설정"
      description="알림 설정 화면입니다. 현재는 연결 가능한 경로를 제공하며 향후 옵션 데이터가 추가됩니다."
    />
  );
}

function SupportPage() {
  return (
    <PlaceholderPage
      title="고객센터"
      description="고객센터 화면입니다. 디자인을 유지한 상태로 동작 가능한 경로를 제공합니다."
    />
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    loader: () => redirect("/auctions"),
  },
  {
    path: "/auctions",
    Component: AuctionHome,
  },
  {
    path: "/auctions/:auctionId",
    Component: AuctionDetail,
  },
  {
    path: "/auctions/new",
    Component: AuctionRegister,
  },
  {
    path: "/auth",
    Component: AuthScreen,
  },
  {
    path: "/mypage",
    Component: MyPage,
  },
  {
    path: "/mypage/my-auctions",
    Component: MyAuctionsPage,
  },
  {
    path: "/mypage/my-bids",
    Component: MyBidsPage,
  },
  {
    path: "/mypage/my-wins",
    Component: MyWinsPage,
  },
  {
    path: "/mypage/my-sales",
    Component: MySalesPage,
  },
  {
    path: "/mypage/payment-history",
    Component: PaymentHistoryPage,
  },
  {
    path: "/mypage/settlement-history",
    Component: SettlementHistoryPage,
  },
  {
    path: "/mypage/notifications",
    Component: NotificationsPage,
  },
  {
    path: "/mypage/support",
    Component: SupportPage,
  },
  {
    path: "/payment/:auctionId",
    Component: Payment,
  },
  {
    path: "/payment",
    loader: () => redirect("/auctions"),
  },
  {
    path: "/auctionDetail",
    loader: () => redirect("/auctions"),
  },
  {
    path: "/auctionRegister",
    loader: () => redirect("/auctions/new"),
  },
  {
    path: "/myPage",
    loader: () => redirect("/mypage"),
  },
  {
    path: "*",
    loader: () => redirect("/auctions"),
  },
]);
