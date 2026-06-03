import { useEffect, useRef } from "react";
import { RouterProvider } from "react-router";
import { useAuth } from "./hooks/useAuth";
import { router } from "./routes";
import { AuthLoadingScreen } from "./components/login/AuthLoadingScreen";

function SessionBootstrapGate() {
  const initialized = useRef(false);
  const { restoreSession, authStatus } = useAuth();

  useEffect(() => {
    // StrictMode에서 effect가 두 번 호출되는 상황을 막기 위한 1회 실행 가드입니다.
    if (initialized.current) {
      return;
    }
    initialized.current = true;
    // 앱 첫 진입 시 저장된 세션(리프레시 토큰 기반)을 복구합니다.
    void restoreSession();
  }, [restoreSession]);

  // 세션 복구 중에는 라우터를 렌더링하지 않고 로딩 화면을 보여줍니다.
  if (authStatus === "idle" || authStatus === "bootstrapping") {
    return <AuthLoadingScreen />;
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  // 인증 상태 초기화가 끝난 뒤 실제 라우팅 화면이 열리도록 게이트를 둡니다.
  return <SessionBootstrapGate />;
}
