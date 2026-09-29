import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";

/**
 * [무엇] 로컬 개발 전용 "테스트 로그인" 패널.
 *        닉네임만 입력하면 카카오 OAuth 없이 즉시 로그인됩니다.
 *        실시간 입찰처럼 계정이 여러 개 필요한 기능을 테스트할 때 사용합니다.
 *
 * [배포 시 제거]
 *   AuthScreen에서 `import.meta.env.DEV` 조건으로만 렌더링합니다.
 *   Vite는 프로덕션 빌드에서 이 값을 false로 치환하므로, 조건문과 이 컴포넌트 모듈
 *   전체가 트리셰이킹으로 번들에서 사라집니다. (백엔드도 dev 프로필에서만 API가 열림)
 *
 * [동작]
 *   1) POST /api/v1/auth/dev/login 으로 테스트 계정 토큰 발급
 *   2) refreshToken을 localStorage에 저장 (프론트가 세션 복구에 쓰는 자리)
 *   3) restoreSession()으로 세션 복구 → 새로고침 없이 로그인 완료
 */

// httpRepository.ts의 REFRESH_TOKEN_KEY와 반드시 동일해야 합니다.
// (dev 전용 코드가 운영 모듈을 수정하지 않도록 의도적으로 분리해 둔 상수)
const REFRESH_TOKEN_KEY = "ym_refresh_token";

// 창을 여러 개 띄워 테스트할 때 자주 쓰는 계정들 — 클릭 한 번으로 입력됩니다.
const QUICK_NICKNAMES = ["tester1", "tester2", "tester3"];

export function DevLoginPanel() {
  const navigate = useNavigate();
  const { restoreSession } = useAuth();
  const [nickname, setNickname] = useState("tester1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDevLogin = async (targetNickname: string) => {
    const trimmed = targetNickname.trim();
    if (!trimmed) {
      setErrorMessage("닉네임을 입력해 주세요.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      // 1) 백엔드 dev 로그인 API 호출 (dev 프로필에서만 열려 있음)
      const response = await fetch("/api/v1/auth/dev/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmed }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        // 백엔드가 내려준 실패 메시지를 그대로 보여줍니다(원인 파악용).
        throw new Error(payload?.message ?? `테스트 로그인 실패 (HTTP ${response.status})`);
      }

      // 2) 프론트가 세션 복구에 사용하는 자리에 refreshToken 저장
      localStorage.setItem(REFRESH_TOKEN_KEY, payload.data.refreshToken);

      // 3) 저장된 토큰으로 세션 복구 (새로고침 불필요)
      await restoreSession();
      navigate("/auctions", { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "테스트 로그인 중 문제가 발생했어요. 백엔드가 dev 프로필로 실행 중인지 확인해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 rounded-[12px] border border-dashed border-[#B0B0B0] bg-[#FAFAFA] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-[4px] bg-[#1A1A1A] px-1.5 py-0.5 text-[10px] font-medium text-white">DEV</span>
        <p className="text-[13px] font-medium text-[#1A1A1A]">테스트 로그인</p>
      </div>

      <p className="mb-3 text-[12px] leading-relaxed text-[#888888]">
        닉네임만 입력하면 카카오 없이 로그인됩니다.
        <br />
        다른 계정으로 동시 접속하려면 <span className="text-[#1A1A1A]">시크릿 창</span>을 사용하세요.
      </p>

      <div className="mb-2 flex gap-2">
        <input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !isSubmitting) {
              void handleDevLogin(nickname);
            }
          }}
          maxLength={20}
          placeholder="닉네임"
          className="h-[40px] flex-1 rounded-[8px] border border-[#DDDDDD] bg-white px-3 text-[14px] text-[#1A1A1A] outline-none focus:border-[#FF6F0F]"
        />
        <button
          onClick={() => {
            void handleDevLogin(nickname);
          }}
          disabled={isSubmitting}
          className="h-[40px] rounded-[8px] bg-[#1A1A1A] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1A1A1A]/90 disabled:opacity-50"
        >
          {isSubmitting ? "로그인 중" : "로그인"}
        </button>
      </div>

      <div className="flex gap-1.5">
        {QUICK_NICKNAMES.map((quickNickname) => (
          <button
            key={quickNickname}
            onClick={() => {
              setNickname(quickNickname);
              void handleDevLogin(quickNickname);
            }}
            disabled={isSubmitting}
            className="rounded-[6px] border border-[#DDDDDD] bg-white px-2.5 py-1 text-[12px] text-[#555555] transition-colors hover:border-[#FF6F0F] hover:text-[#FF6F0F] disabled:opacity-50"
          >
            {quickNickname}
          </button>
        ))}
      </div>

      {errorMessage && <p className="mt-3 text-[12px] text-[#FF3B30]">{errorMessage}</p>}
    </div>
  );
}
