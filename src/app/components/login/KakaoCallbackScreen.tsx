import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { AuthLoadingScreen } from "./AuthLoadingScreen";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "카카오 로그인 처리 중 문제가 발생했어요.";
}

export function KakaoCallbackScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { completeKakaoCallback } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    // 인가 코드/상태값이 없으면 인증을 다시 시작해야 합니다.
    if (!code || !state) {
      setErrorMessage("카카오 인증 정보가 누락되었어요. 다시 로그인해 주세요.");
      return;
    }

    void (async () => {
      try {
        // 콜백 처리 결과에 따라 "추가정보 입력" 또는 "경매 목록"으로 분기합니다.
        const result = await completeKakaoCallback({
          code,
          state,
          redirectUri: `${window.location.origin}/auth/kakao/callback`,
        });
        if (cancelled) {
          return;
        }

        if (result.requiresProfileSetup) {
          navigate("/auth/signup/complete", { replace: true });
          return;
        }
        navigate("/auctions", { replace: true });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setErrorMessage(getErrorMessage(error));
      }
    })();

    return () => {
      // 화면 이탈 후 비동기 응답이 와도 상태 업데이트를 막습니다.
      cancelled = true;
    };
  }, [location.search, completeKakaoCallback, navigate]);

  if (!errorMessage) {
    return <AuthLoadingScreen message="카카오 로그인 결과를 확인하고 있어요." />;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[390px] bg-[#FFF4F0] border border-[#FF6F0F]/20 rounded-[12px] p-6 text-center">
        <div className="flex justify-center mb-3">
          <AlertCircle className="w-6 h-6 text-[#FF6F0F]" />
        </div>
        <p className="text-[15px] text-[#1A1A1A] leading-relaxed mb-4">{errorMessage}</p>
        <button
          onClick={() => navigate("/auth", { replace: true })}
          className="w-full h-[44px] bg-[#FF6F0F] text-white rounded-[8px] text-[15px] font-medium"
        >
          로그인 다시 시도
        </button>
      </div>
    </div>
  );
}
