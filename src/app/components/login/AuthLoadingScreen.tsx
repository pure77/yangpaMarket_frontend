import { Hammer, LoaderCircle } from "lucide-react";

interface AuthLoadingScreenProps {
  message?: string;
}

export function AuthLoadingScreen({ message = "로그인 상태를 확인하고 있어요." }: AuthLoadingScreenProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[390px] text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Hammer className="w-6 h-6 text-[#FF6F0F]" />
          <h1 className="text-[24px] font-semibold text-[#1A1A1A]">경매마켓</h1>
        </div>
        <div className="flex items-center justify-center gap-2 text-[14px] text-[#888888]">
          <LoaderCircle className="w-4 h-4 animate-spin" />
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
}

