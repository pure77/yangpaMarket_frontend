import { useEffect, useState } from "react";
import { Hammer } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "카카오 로그인 연결 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.";
}

export function AuthScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, authStatus, authNotice, startKakaoLogin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const authNoticeMessage =
    authNotice === "SESSION_EXPIRED"
      ? "세션이 만료되었어요. 카카오로 다시 로그인해 주세요."
      : authNotice === "LOGIN_REQUIRED"
        ? "로그인이 필요해요. 카카오로 로그인해 주세요."
        : "";

  useEffect(() => {
    // 이미 로그인된 사용자가 인증 화면에 오면 경매 목록으로 되돌립니다.
    if (isAuthenticated && authStatus === "authenticated") {
      navigate("/auctions", { replace: true });
    }
  }, [isAuthenticated, authStatus, navigate]);

  const handleKakaoLogin = async () => {
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      // OAuth 시작: repository가 내려준 인가 URL로 이동합니다.
      await startKakaoLogin();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[390px]">
        {authNoticeMessage && (
          <div className="mb-4 rounded-[10px] border border-[#FF6F0F]/25 bg-[#FFF4EC] px-4 py-3">
            <p className="text-[13px] text-[#C24A00]">{authNoticeMessage}</p>
          </div>
        )}

        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Hammer className="w-6 h-6 text-[#FF6F0F]" />
            <h1 className="text-[24px] font-semibold text-[#1A1A1A]">경매마켓</h1>
          </div>
          <p className="text-[14px] text-[#888888]">카카오 계정으로 3초 만에 시작해 보세요.</p>
        </div>

        <div className="bg-[#F5F5F5] rounded-[12px] p-5 mb-6">
          <p className="text-[14px] text-[#1A1A1A] leading-relaxed">
            간편 로그인 후 바로 경매 참여가 가능해요.
            <br />
            처음 로그인이라면 추가 정보만 입력하면 됩니다.
          </p>
        </div>

        <button
          onClick={() => {
            void handleKakaoLogin();
          }}
          disabled={isSubmitting}
          className="w-full h-[52px] bg-[#FEE500] text-[#1A1A1A] rounded-[8px] font-medium flex items-center justify-center gap-2 hover:bg-[#FEE500]/90 transition-colors disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M10 3C5.58172 3 2 5.89543 2 9.5C2 11.6484 3.28516 13.5312 5.26172 14.668L4.38281 17.8945C4.32031 18.1133 4.56641 18.2891 4.75391 18.168L8.60156 15.7188C9.05469 15.7773 9.52344 15.8125 10 15.8125C14.4183 15.8125 18 12.9141 18 9.3125C18 5.71094 14.4183 3 10 3Z"
              fill="#1A1A1A"
            />
          </svg>
          카카오로 시작하기
        </button>

        {errorMessage && (
          <div className="mt-4 text-center">
            <p className="text-[13px] text-[#FF3B30]">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
