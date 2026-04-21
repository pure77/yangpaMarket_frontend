import { useState } from 'react';
import { ArrowLeft, X, Camera, ChevronDown } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useNavigate } from 'react-router';
import { useAuctions } from '../../hooks/useAuctions';
import { useAuth } from '../../hooks/useAuth';

type ProductCondition = '미사용' | '거의새것' | '사용감있음';

export function AuctionRegister() {
  const navigate = useNavigate();
  const { createAuction } = useAuctions();
  const { isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [productCondition, setProductCondition] = useState<ProductCondition>('거의새것');
  const [enableBuyNow, setEnableBuyNow] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    startPrice: '',
    buyNowPrice: '',
    endDateTime: '',
  });

  const categories = ['전자기기', '패션', '생활/가전', '수집품', '스포츠', '기타'];

  const steps = [
    { number: 1, label: '기본정보' },
    { number: 2, label: '가격설정' },
    { number: 3, label: '확인' },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Mock image upload - in real app would upload to server
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file));
      setUploadedImages((prev) => [...prev, ...newImages].slice(0, 10));
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!formData.title || !formData.category || !formData.description) {
        setErrorMessage('기본 정보를 모두 입력해주세요.');
        return;
      }
      setErrorMessage('');
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!formData.startPrice || !formData.endDateTime) {
        setErrorMessage('가격과 마감 시간을 입력해주세요.');
        return;
      }
      if (enableBuyNow && formData.buyNowPrice && Number(formData.buyNowPrice) < Number(formData.startPrice)) {
        setErrorMessage('즉시구매가는 시작가보다 높아야 합니다.');
        return;
      }
      setErrorMessage('');
      setCurrentStep(3);
      return;
    }

    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const created = await createAuction({
        title: formData.title,
        category: formData.category,
        description: formData.description,
        condition: productCondition,
        startPrice: Number(formData.startPrice),
        buyNowPrice: enableBuyNow && formData.buyNowPrice ? Number(formData.buyNowPrice) : null,
        endDateTime: formData.endDateTime,
        images: uploadedImages,
      });
      navigate(`/auctions/${created.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Navigation */}
      <div className="sticky top-0 bg-white z-20 border-b border-[#E8E8E8]">
        <div className="max-w-[390px] mx-auto px-4 h-14 flex items-center justify-center relative">
          <button onClick={() => navigate(-1)} className="absolute left-4 p-1">
            <ArrowLeft className="w-6 h-6 text-[#1A1A1A]" />
          </button>
          <h1 className="text-[18px] font-semibold text-[#1A1A1A]">경매 등록</h1>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-[390px] mx-auto px-4">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 py-6">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center gap-2">
                <div
                  className={`px-4 py-2 rounded-full text-[14px] font-medium transition-colors ${
                    currentStep >= step.number
                      ? 'bg-[#FF6F0F] text-white'
                      : 'bg-[#F5F5F5] text-[#888888]'
                  }`}
                >
                  {step.label}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-2 h-0.5 bg-[#E8E8E8]" />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Photo Upload Area */}
              <div>
                <label className="block text-[15px] font-medium text-[#1A1A1A] mb-2">
                  사진
                </label>
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#E8E8E8] rounded-[12px] cursor-pointer hover:bg-[#F5F5F5] transition-colors bg-white">
                  <Camera className="w-10 h-10 text-[#888888] mb-2" />
                  <p className="text-[14px] text-[#888888]">
                    사진을 추가하세요 (최대 10장)
                  </p>
                  <p className="text-[12px] text-[#AAAAAA] mt-1">
                    {uploadedImages.length}/10
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {/* Uploaded Images Thumbnails */}
                {uploadedImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto mt-3 pb-2 scrollbar-hide">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative flex-shrink-0">
                        <ImageWithFallback
                          src={image}
                          alt={`Upload ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-[8px]"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#1A1A1A] rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-[15px] font-medium text-[#1A1A1A] mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="상품 제목을 입력하세요"
                  className="w-full h-[52px] px-4 bg-[#F5F5F5] rounded-[8px] border-0 text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F] text-[15px]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[15px] font-medium text-[#1A1A1A] mb-2">
                  카테고리
                </label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-[52px] px-4 bg-[#F5F5F5] rounded-[8px] border-0 text-[#1A1A1A] appearance-none focus:outline-none focus:ring-2 focus:ring-[#FF6F0F] text-[15px] cursor-pointer"
                  >
                    <option value="">카테고리를 선택하세요</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888] pointer-events-none" />
                </div>
              </div>

              {/* Product Condition */}
              <div>
                <label className="block text-[15px] font-medium text-[#1A1A1A] mb-2">
                  상품 상태
                </label>
                <div className="flex gap-2">
                  {(['미사용', '거의새것', '사용감있음'] as ProductCondition[]).map(
                    (condition) => (
                      <button
                        key={condition}
                        onClick={() => setProductCondition(condition)}
                        className={`flex-1 h-[52px] rounded-[8px] text-[15px] font-medium transition-colors ${
                          productCondition === condition
                            ? 'bg-[#FF6F0F] text-white'
                            : 'bg-[#F5F5F5] text-[#1A1A1A]'
                        }`}
                      >
                        {condition}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[15px] font-medium text-[#1A1A1A] mb-2">
                  상품 설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="상품에 대해 자세히 설명해주세요"
                  rows={4}
                  className="w-full px-4 py-3 bg-[#F5F5F5] rounded-[8px] border-0 text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F] text-[15px] resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Step 2: Pricing */}
          {currentStep === 2 && (
            <div className="space-y-6 pt-4">
              <div className="h-[1px] bg-[#E8E8E8] -mx-4" />

              <h2 className="text-[17px] font-bold text-[#1A1A1A] pt-2">가격 설정</h2>

              {/* Start Price */}
              <div>
                <label className="block text-[15px] font-medium text-[#1A1A1A] mb-2">
                  시작가
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.startPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, startPrice: e.target.value })
                    }
                    placeholder="0"
                    className="w-full h-[52px] px-4 pr-12 bg-[#F5F5F5] rounded-[8px] border-0 text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F] text-[15px]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[15px] text-[#888888]">
                    원
                  </span>
                </div>
              </div>

              {/* Buy Now Price */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[15px] font-medium text-[#1A1A1A]">
                    즉시구매가
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableBuyNow}
                      onChange={(e) => setEnableBuyNow(e.target.checked)}
                      className="w-10 h-6 appearance-none bg-[#E8E8E8] rounded-full relative cursor-pointer transition-colors checked:bg-[#FF6F0F]"
                      style={{
                        backgroundImage: enableBuyNow
                          ? 'none'
                          : 'none',
                      }}
                    />
                    <style>{`
                      input[type="checkbox"]:checked::before {
                        content: '';
                        position: absolute;
                        top: 2px;
                        right: 2px;
                        width: 20px;
                        height: 20px;
                        background: white;
                        border-radius: 50%;
                        transition: all 0.3s;
                      }
                      input[type="checkbox"]::before {
                        content: '';
                        position: absolute;
                        top: 2px;
                        left: 2px;
                        width: 20px;
                        height: 20px;
                        background: white;
                        border-radius: 50%;
                        transition: all 0.3s;
                      }
                    `}</style>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.buyNowPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, buyNowPrice: e.target.value })
                    }
                    placeholder="0"
                    disabled={!enableBuyNow}
                    className="w-full h-[52px] px-4 pr-12 bg-[#F5F5F5] rounded-[8px] border-0 text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F] text-[15px] disabled:opacity-50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[15px] text-[#888888]">
                    원
                  </span>
                </div>
              </div>

              {/* End Date/Time */}
              <div>
                <label className="block text-[15px] font-medium text-[#1A1A1A] mb-2">
                  경매 마감
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDateTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endDateTime: e.target.value })
                  }
                  className="w-full h-[52px] px-4 bg-[#F5F5F5] rounded-[8px] border-0 text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F] text-[15px]"
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-6 pt-4">
              <h2 className="text-[17px] font-bold text-[#1A1A1A]">등록 정보 확인</h2>

              <div className="bg-[#F5F5F5] rounded-[12px] p-4 space-y-4">
                <div>
                  <p className="text-[13px] text-[#888888] mb-1">제목</p>
                  <p className="text-[15px] text-[#1A1A1A] font-medium">
                    {formData.title || '-'}
                  </p>
                </div>
                <div className="h-[1px] bg-white" />
                <div>
                  <p className="text-[13px] text-[#888888] mb-1">카테고리</p>
                  <p className="text-[15px] text-[#1A1A1A] font-medium">
                    {formData.category || '-'}
                  </p>
                </div>
                <div className="h-[1px] bg-white" />
                <div>
                  <p className="text-[13px] text-[#888888] mb-1">상품 상태</p>
                  <p className="text-[15px] text-[#1A1A1A] font-medium">
                    {productCondition}
                  </p>
                </div>
                <div className="h-[1px] bg-white" />
                <div>
                  <p className="text-[13px] text-[#888888] mb-1">시작가</p>
                  <p className="text-[15px] text-[#FF6F0F] font-bold">
                    {formData.startPrice
                      ? Number(formData.startPrice).toLocaleString('ko-KR') + '원'
                      : '-'}
                  </p>
                </div>
                {enableBuyNow && formData.buyNowPrice && (
                  <>
                    <div className="h-[1px] bg-white" />
                    <div>
                      <p className="text-[13px] text-[#888888] mb-1">즉시구매가</p>
                      <p className="text-[15px] text-[#1A1A1A] font-bold">
                        {Number(formData.buyNowPrice).toLocaleString('ko-KR')}원
                      </p>
                    </div>
                  </>
                )}
                <div className="h-[1px] bg-white" />
                <div>
                  <p className="text-[13px] text-[#888888] mb-1">경매 마감</p>
                  <p className="text-[15px] text-[#1A1A1A] font-medium">
                    {formData.endDateTime
                      ? new Date(formData.endDateTime).toLocaleString('ko-KR')
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="bg-[#FFF4F0] border border-[#FF6F0F]/20 rounded-[12px] p-4">
                <p className="text-[13px] text-[#FF6F0F] leading-relaxed">
                  등록 후에는 수정이 불가능합니다. 입력하신 정보를 다시 한번 확인해주세요.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E8E8] z-10">
        <div className="max-w-[390px] mx-auto px-4 py-3">
          {errorMessage && (
            <p className="text-[12px] text-[#FF3B30] mb-2">{errorMessage}</p>
          )}
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="w-full h-[52px] bg-[#FF6F0F] text-white rounded-[8px] font-bold text-[16px] hover:bg-[#FF6F0F]/90 transition-colors disabled:opacity-50"
          >
            {currentStep === 3 ? (isSubmitting ? '등록 중...' : '등록하기') : '다음'}
          </button>
        </div>
      </div>

      <style>
        {`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
    </div>
  );
}
