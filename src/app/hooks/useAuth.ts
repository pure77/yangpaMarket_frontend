import { useCallback } from "react";
import type { CompleteKakaoCallbackInput, CompleteSignupInput } from "../domain/types";
import { repositories } from "../repositories";
import { useAppSelector } from "../state/appStore";

export function useAuth() {
  // UI에서 필요한 인증 상태는 전역 스토어에서 구독합니다.
  const session = useAppSelector((state) => state.session);

  const startKakaoLogin = useCallback(async () => {
    // 로그인 URL을 받아 브라우저를 카카오 인증 페이지로 이동시킵니다.
    const { authorizeUrl } = await repositories.auth.getKakaoLoginUrl();
    window.location.href = authorizeUrl;
  }, []);

  const completeKakaoCallback = useCallback(async (input: CompleteKakaoCallbackInput) => {
    return repositories.auth.completeKakaoCallback(input);
  }, []);

  const completeSignup = useCallback(async (input: CompleteSignupInput) => {
    return repositories.auth.completeSignup(input);
  }, []);

  const restoreSession = useCallback(async () => {
    return repositories.auth.restoreSession();
  }, []);

  const logout = useCallback(async () => {
    await repositories.auth.logout();
  }, []);

  // 화면에서는 이 훅만 사용하면 "현재 상태 + 인증 액션"을 한 번에 사용할 수 있습니다.
  return {
    session,
    user: session.user,
    pendingSignup: session.pendingSignup,
    isAuthenticated: session.isAuthenticated,
    authStatus: session.authStatus,
    authNotice: session.authNotice,
    startKakaoLogin,
    completeKakaoCallback,
    completeSignup,
    restoreSession,
    logout,
  };
}
