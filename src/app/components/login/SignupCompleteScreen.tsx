import { useEffect, useMemo, useState } from "react";
import { Check, Hammer } from "lucide-react";
import { useNavigate } from "react-router";
import type { Agreement } from "../../domain/types";
import { useAuth } from "../../hooks/useAuth";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function isValidPhone(phone: string): boolean {
  return /^010-\d{4}-\d{4}$/.test(phone);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "추가 정보 저장에 실패했어요. 잠시 후 다시 시도해 주세요.";
}

export function SignupCompleteScreen() {
  const navigate = useNavigate();
  const { pendingSignup, completeSignup } = useAuth();
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [terms, setTerms] = useState({
    service: false,
    privacy: false,
    marketing: false,
  });

  useEffect(() => {
    // pendingSignup이 없으면 직접 접근으로 판단해 로그인 페이지로 되돌립니다.
    if (!pendingSignup) {
      navigate("/auth", { replace: true });
      return;
    }
    setNickname(pendingSignup.nickname ?? "");
  }, [pendingSignup, navigate]);

  const allAgree = useMemo(
    () => terms.service && terms.privacy && terms.marketing,
    [terms.service, terms.privacy, terms.marketing],
  );

  if (!pendingSignup) {
    return null;
  }

  const agreements: Agreement[] = [
    { termCode: "TERMS_OF_SERVICE", isRequired: true, agreed: terms.service },
    { termCode: "PRIVACY_POLICY", isRequired: true, agreed: terms.privacy },
    { termCode: "MARKETING", isRequired: false, agreed: terms.marketing },
  ];

  const handleSubmit = async () => {
    // 회원가입 완료 전 기본 유효성 검사를 수행합니다.
    if (!nickname.trim()) {
      setErrorMessage("닉네임을 입력해 주세요.");
      return;
    }
    if (!isValidPhone(phone)) {
      setErrorMessage("휴대폰 번호를 010-0000-0000 형식으로 입력해 주세요.");
      return;
    }
    if (!terms.service || !terms.privacy) {
      setErrorMessage("필수 약관에 동의해 주세요.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      // 서버에 추가 정보 저장 후 정상 세션으로 전환됩니다.
      await completeSignup({
        signupToken: pendingSignup.signupToken,
        nickname: nickname.trim(),
        phone,
        marketingOptIn: terms.marketing,
        agreements,
      });
      navigate("/auctions", { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[390px]">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Hammer className="w-6 h-6 text-[#FF6F0F]" />
            <h1 className="text-[24px] font-semibold text-[#1A1A1A]">추가 정보 입력</h1>
          </div>
          <p className="text-[14px] text-[#888888]">한 번만 입력하면 바로 경매를 시작할 수 있어요.</p>
        </div>

        <div className="space-y-4">
          <div className="h-[52px] px-4 bg-[#F5F5F5] rounded-[8px] flex items-center text-[14px] text-[#888888]">
            {pendingSignup.email ?? "카카오 계정"}
          </div>

          <input
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="닉네임"
            className="w-full h-[52px] px-4 bg-[#F5F5F5] rounded-[8px] border-0 text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F]"
          />

          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(formatPhone(event.target.value))}
            placeholder="휴대폰 번호 (010-0000-0000)"
            className="w-full h-[52px] px-4 bg-[#F5F5F5] rounded-[8px] border-0 text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F]"
          />

          <div className="bg-[#F5F5F5] rounded-[12px] p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={allAgree}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setTerms({
                      service: checked,
                      privacy: checked,
                      marketing: checked,
                    });
                  }}
                  className="w-5 h-5 rounded border-2 border-[#888888] appearance-none checked:bg-[#FF6F0F] checked:border-[#FF6F0F]"
                />
                {allAgree && (
                  <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                )}
              </div>
              <span className="text-[15px] font-medium text-[#1A1A1A]">전체 동의</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer pl-1">
              <input
                type="checkbox"
                checked={terms.service}
                onChange={(event) => setTerms((prev) => ({ ...prev, service: event.target.checked }))}
                className="w-4 h-4 rounded border border-[#888888] accent-[#FF6F0F]"
              />
              <span className="text-[14px] text-[#1A1A1A]">서비스 이용약관 동의 (필수)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer pl-1">
              <input
                type="checkbox"
                checked={terms.privacy}
                onChange={(event) => setTerms((prev) => ({ ...prev, privacy: event.target.checked }))}
                className="w-4 h-4 rounded border border-[#888888] accent-[#FF6F0F]"
              />
              <span className="text-[14px] text-[#1A1A1A]">개인정보 처리방침 동의 (필수)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer pl-1">
              <input
                type="checkbox"
                checked={terms.marketing}
                onChange={(event) => setTerms((prev) => ({ ...prev, marketing: event.target.checked }))}
                className="w-4 h-4 rounded border border-[#888888] accent-[#FF6F0F]"
              />
              <span className="text-[14px] text-[#888888]">마케팅 정보 수신 동의 (선택)</span>
            </label>
          </div>

          {errorMessage && <p className="text-[13px] text-[#FF3B30]">{errorMessage}</p>}

          <button
            onClick={() => {
              void handleSubmit();
            }}
            disabled={isSubmitting}
            className="w-full h-[52px] bg-[#FF6F0F] text-white rounded-[8px] font-medium hover:bg-[#FF6F0F]/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "저장 중..." : "가입 완료하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
