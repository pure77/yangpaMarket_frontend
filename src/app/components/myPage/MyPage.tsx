import { Settings, ChevronRight, Camera, FileText, Gavel, CreditCard, DollarSign, Bell, HelpCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import { BottomNav } from '../common/BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { useAuctions } from '../../hooks/useAuctions';

export function MyPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { auctions, bids } = useAuctions();
  const currentUserId = user?.id ?? '';

  const interestCount = new Set(
    bids.filter((item) => item.bidderId === currentUserId).map((item) => item.auctionId),
  ).size;

  const activityStats = [
    {
      label: '진행중인 경매',
      value: auctions.filter((item) => item.sellerId === currentUserId && !item.isSold).length,
    },
    {
      label: '낙찰된 경매',
      value: auctions.filter((item) => item.winnerUserId === currentUserId).length,
    },
    { label: '관심 목록', value: interestCount },
  ];

  const myAuctionMenuItems = [
    { icon: FileText, label: '등록한 경매', path: '/mypage/my-auctions' },
    { icon: Gavel, label: '입찰 중인 경매', path: '/mypage/my-bids' },
    { icon: Gavel, label: '낙찰된 경매', path: '/mypage/my-wins' },
    { icon: FileText, label: '판매 완료', path: '/mypage/my-sales' },
  ];

  const paymentMenuItems = [
    { icon: CreditCard, label: '결제 내역', path: '/mypage/payment-history' },
    { icon: DollarSign, label: '정산 내역', path: '/mypage/settlement-history' },
  ];

  const settingsMenuItems = [
    { icon: Bell, label: '알림 설정', path: '/mypage/notifications' },
    { icon: HelpCircle, label: '고객센터', path: '/mypage/support' },
  ];

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-[390px] mx-auto">
        {/* Top Navigation */}
        <div className="sticky top-0 bg-white z-10 border-b border-[#E8E8E8]">
          <div className="px-4 h-14 flex items-center justify-between">
            <h1 className="text-[18px] font-semibold text-[#1A1A1A]">마이페이지</h1>
            <button className="p-1" onClick={() => navigate('/mypage/notifications')}>
              <Settings className="w-6 h-6 text-[#1A1A1A]" />
            </button>
          </div>
        </div>

        {/* Profile Section */}
        <div className="px-4 py-6">
          <div className="bg-white border border-[#E8E8E8] rounded-[12px] p-5">
            <div className="flex items-start gap-4 mb-4">
              {/* Avatar with Edit Icon */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 bg-[#F5F5F5] rounded-full flex items-center justify-center">
                  <span className="text-[24px] font-semibold text-[#888888]">
                    {(user?.nickname ?? '게스트').slice(0, 1)}
                  </span>
                </div>
                <button className="absolute bottom-0 right-0 w-7 h-7 bg-[#FF6F0F] rounded-full flex items-center justify-center border-2 border-white">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              {/* User Info */}
              <div className="flex-1 pt-2">
                <h2 className="text-[18px] font-bold text-[#1A1A1A] mb-1">
                  {user?.nickname ?? '게스트'}
                </h2>
                <p className="text-[14px] text-[#888888]">{user?.email ?? '로그인이 필요합니다'}</p>
              </div>
            </div>
            {/* Edit Profile Button */}
            <button className="w-full h-10 border border-[#E8E8E8] rounded-[8px] text-[15px] font-medium text-[#1A1A1A] hover:bg-[#F5F5F5] transition-colors">
              프로필 수정
            </button>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="px-4 pb-6">
          <div className="flex gap-2">
            {activityStats.map((stat, index) => (
              <div
                key={index}
                className="flex-1 bg-[#F5F5F5] rounded-[12px] p-4 text-center"
              >
                <p className="text-[20px] font-bold text-[#FF6F0F] mb-1">{stat.value}</p>
                <p className="text-[13px] text-[#888888]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Sections */}
        <div className="pb-6">
          {/* 내 경매 활동 */}
          <div className="mb-6">
            <h3 className="px-4 text-[15px] font-bold text-[#1A1A1A] mb-3">내 경매 활동</h3>
            <div className="bg-white">
              {myAuctionMenuItems.map((item, index) => (
                <div key={index}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="w-full px-4 h-14 flex items-center justify-between hover:bg-[#F5F5F5] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-[#888888]" />
                      <span className="text-[16px] text-[#1A1A1A]">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#888888]" />
                  </button>
                  {index < myAuctionMenuItems.length - 1 && (
                    <div className="h-[0.5px] bg-[#E8E8E8] mx-4" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 결제 / 정산 */}
          <div className="mb-6">
            <h3 className="px-4 text-[15px] font-bold text-[#1A1A1A] mb-3">결제 / 정산</h3>
            <div className="bg-white">
              {paymentMenuItems.map((item, index) => (
                <div key={index}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="w-full px-4 h-14 flex items-center justify-between hover:bg-[#F5F5F5] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-[#888888]" />
                      <span className="text-[16px] text-[#1A1A1A]">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#888888]" />
                  </button>
                  {index < paymentMenuItems.length - 1 && (
                    <div className="h-[0.5px] bg-[#E8E8E8] mx-4" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 설정 */}
          <div>
            <h3 className="px-4 text-[15px] font-bold text-[#1A1A1A] mb-3">설정</h3>
            <div className="bg-white">
              {settingsMenuItems.map((item, index) => (
                <div key={index}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="w-full px-4 h-14 flex items-center justify-between hover:bg-[#F5F5F5] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-[#888888]" />
                      <span className="text-[16px] text-[#1A1A1A]">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#888888]" />
                  </button>
                  <div className="h-[0.5px] bg-[#E8E8E8] mx-4" />
                </div>
              ))}
              {/* Logout */}
              <button
                onClick={() => {
                  void (async () => {
                    await logout();
                    navigate('/auth');
                  })();
                }}
                className="w-full px-4 h-14 flex items-center hover:bg-[#F5F5F5] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-[#FF3B30]" />
                  <span className="text-[16px] text-[#FF3B30]">로그아웃</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      <BottomNav activeTab="mypage" />
    </div>
  );
}
