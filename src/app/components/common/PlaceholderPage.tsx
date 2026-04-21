import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[390px] mx-auto">
        <div className="sticky top-0 bg-white z-10 border-b border-[#E8E8E8]">
          <div className="px-4 h-14 flex items-center justify-center relative">
            <button onClick={() => navigate(-1)} className="absolute left-4 p-1">
              <ArrowLeft className="w-6 h-6 text-[#1A1A1A]" />
            </button>
            <h1 className="text-[18px] font-semibold text-[#1A1A1A]">{title}</h1>
          </div>
        </div>

        <div className="px-4 py-10">
          <div className="bg-[#F5F5F5] rounded-[12px] p-5 border border-[#E8E8E8]">
            <p className="text-[15px] font-medium text-[#1A1A1A] mb-2">{title}</p>
            <p className="text-[14px] text-[#888888] leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
