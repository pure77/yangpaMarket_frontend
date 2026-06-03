import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { AuthLoadingScreen } from "../login/AuthLoadingScreen";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const { isAuthenticated, authStatus } = useAuth();

  // 세션 복구가 끝나기 전에는 판정을 보류하고 로딩만 보여줍니다.
  if (authStatus === "idle" || authStatus === "bootstrapping") {
    return <AuthLoadingScreen />;
  }

  // 비로그인 사용자는 인증 화면으로 보내고, 원래 진입 경로를 state로 전달합니다.
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
