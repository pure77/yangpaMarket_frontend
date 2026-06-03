
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// React 앱의 시작점: #root 엘리먼트에 최상위 App 컴포넌트를 렌더링합니다.
createRoot(document.getElementById("root")!).render(<App />);
  
