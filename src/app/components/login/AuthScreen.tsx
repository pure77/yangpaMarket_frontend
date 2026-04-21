import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Hammer, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';

type TabType = 'login' | 'signup';

export function AuthScreen() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [expandTerms, setExpandTerms] = useState(false);
  const [allAgree, setAllAgree] = useState(false);
  const [terms, setTerms] = useState({
    age: false,
    service: false,
    privacy: false,
    marketing: false,
  });

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAllAgree = (checked: boolean) => {
    setAllAgree(checked);
    setTerms({
      age: checked,
      service: checked,
      privacy: checked,
      marketing: checked,
    });
  };

  const handleTermChange = (key: keyof typeof terms, checked: boolean) => {
    const newTerms = { ...terms, [key]: checked };
    setTerms(newTerms);
    setAllAgree(Object.values(newTerms).every(Boolean));
  };

  const passwordsMatch = signupForm.password && signupForm.password === signupForm.confirmPassword;

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      setErrorMessage('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await login(loginForm.email, loginForm.password);
      navigate('/auctions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async () => {
    if (
      !signupForm.nickname ||
      !signupForm.email ||
      !signupForm.password ||
      !signupForm.confirmPassword ||
      !signupForm.phone
    ) {
      setErrorMessage('회원가입 정보를 모두 입력해주세요.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!terms.age || !terms.service || !terms.privacy) {
      setErrorMessage('필수 약관에 동의해주세요.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await signup({
        nickname: signupForm.nickname,
        email: signupForm.email,
        password: signupForm.password,
        phone: signupForm.phone,
      });
      navigate('/auctions');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[390px]">
        {/* Logo and Tagline */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Hammer className="w-6 h-6 text-[#FF6F0F]" />
            <h1 className="text-[24px] font-semibold text-[#1A1A1A]">경매마켓</h1>
          </div>
          <p className="text-[14px] text-[#888888]">지금 바로 경매에 참여하세요</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex mb-6">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 pb-3 text-[16px] font-medium transition-colors relative ${
              activeTab === 'login' ? 'text-[#1A1A1A]' : 'text-[#888888]'
            }`}
          >
            로그인
            {activeTab === 'login' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF6F0F]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 pb-3 text-[16px] font-medium transition-colors relative ${
              activeTab === 'signup' ? 'text-[#1A1A1A]' : 'text-[#888888]'
            }`}
          >
            회원가입
            {activeTab === 'signup' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF6F0F]" />
            )}
          </button>
        </div>

        {/* Login Tab Content */}
        {activeTab === 'login' && (
          <div className="space-y-4">
            {/* Email Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Mail className="w-5 h-5 text-[#888888]" />
              </div>
              <input
                type="email"
                placeholder="이메일"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full h-[52px] pl-12 pr-4 bg-[#F5F5F5] rounded-[8px] border-0 text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F]"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Lock className="w-5 h-5 text-[#888888]" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full h-[52px] pl-12 pr-12 bg-[#F5F5F5] rounded-[8px] border-0 text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-[#888888]" />
                ) : (
                  <Eye className="w-5 h-5 text-[#888888]" />
                )}
              </button>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={isSubmitting}
              className="w-full h-[52px] bg-[#FF6F0F] text-white rounded-[8px] font-medium hover:bg-[#FF6F0F]/90 transition-colors disabled:opacity-50"
            >
              로그인
            </button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button className="text-[14px] text-[#888888] hover:text-[#1A1A1A]">
                비밀번호를 잊으셨나요?
              </button>
            </div>
          </div>
        )}

        {/* Signup Tab Content */}
        {activeTab === 'signup' && (
          <div className="space-y-4">
            {/* Nickname Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="닉네임"
                value={signupForm.nickname}
                onChange={(e) => setSignupForm({ ...signupForm, nickname: e.target.value })}
                className="w-full h-[52px] px-4 bg-[#F5F5F5] rounded-[8px] border-0 text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F]"
              />
            </div>

            {/* Email Input with Duplicate Check */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Mail className="w-5 h-5 text-[#888888]" />
                </div>
                <input
                  type="email"
                  placeholder="이메일"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  className="w-full h-[52px] pl-12 pr-4 bg-[#F5F5F5] rounded-[8px] border-0 text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F]"
                />
              </div>
              <button className="h-[52px] px-4 bg-[#F5F5F5] text-[#1A1A1A] rounded-[8px] whitespace-nowrap text-[14px] font-medium hover:bg-[#E8E8E8] transition-colors">
                중복확인
              </button>
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Lock className="w-5 h-5 text-[#888888]" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호"
                value={signupForm.password}
                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                className="w-full h-[52px] pl-12 pr-12 bg-[#F5F5F5] rounded-[8px] border-0 text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-[#888888]" />
                ) : (
                  <Eye className="w-5 h-5 text-[#888888]" />
                )}
              </button>
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Lock className="w-5 h-5 text-[#888888]" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="비밀번호 확인"
                value={signupForm.confirmPassword}
                onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                className="w-full h-[52px] pl-12 pr-12 bg-[#F5F5F5] rounded-[8px] border-0 text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F]"
              />
              {passwordsMatch && signupForm.confirmPassword && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
              )}
              {!passwordsMatch && signupForm.confirmPassword && (
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-[#888888]" />
                  ) : (
                    <Eye className="w-5 h-5 text-[#888888]" />
                  )}
                </button>
              )}
            </div>

            {/* Phone Number Input with Verification */}
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="휴대폰 번호"
                value={signupForm.phone}
                onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                className="flex-1 h-[52px] px-4 bg-[#F5F5F5] rounded-[8px] border-0 text-[#1A1A1A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#FF6F0F]"
              />
              <button className="h-[52px] px-4 bg-[#F5F5F5] text-[#1A1A1A] rounded-[8px] whitespace-nowrap text-[14px] font-medium hover:bg-[#E8E8E8] transition-colors">
                인증번호 받기
              </button>
            </div>

            {/* Terms Agreement */}
            <div className="bg-[#F5F5F5] rounded-[12px] p-4 space-y-3">
              {/* All Agree */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={allAgree}
                    onChange={(e) => handleAllAgree(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-[#888888] appearance-none checked:bg-[#FF6F0F] checked:border-[#FF6F0F] cursor-pointer"
                  />
                  {allAgree && (
                    <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
                <span className="text-[15px] font-medium text-[#1A1A1A]">전체 동의</span>
                <button
                  type="button"
                  onClick={() => setExpandTerms(!expandTerms)}
                  className="ml-auto"
                >
                  {expandTerms ? (
                    <ChevronUp className="w-5 h-5 text-[#888888]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#888888]" />
                  )}
                </button>
              </label>

              {/* Expandable Terms */}
              {expandTerms && (
                <div className="pl-8 space-y-2 pt-2 border-t border-white">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={terms.age}
                        onChange={(e) => handleTermChange('age', e.target.checked)}
                        className="w-4 h-4 rounded border border-[#888888] appearance-none checked:bg-[#FF6F0F] checked:border-[#FF6F0F] cursor-pointer"
                      />
                      {terms.age && (
                        <Check className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                    <span className="text-[14px] text-[#1A1A1A]">만 14세 이상입니다 (필수)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={terms.service}
                        onChange={(e) => handleTermChange('service', e.target.checked)}
                        className="w-4 h-4 rounded border border-[#888888] appearance-none checked:bg-[#FF6F0F] checked:border-[#FF6F0F] cursor-pointer"
                      />
                      {terms.service && (
                        <Check className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                    <span className="text-[14px] text-[#1A1A1A]">서비스 이용약관 (필수)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={terms.privacy}
                        onChange={(e) => handleTermChange('privacy', e.target.checked)}
                        className="w-4 h-4 rounded border border-[#888888] appearance-none checked:bg-[#FF6F0F] checked:border-[#FF6F0F] cursor-pointer"
                      />
                      {terms.privacy && (
                        <Check className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                    <span className="text-[14px] text-[#1A1A1A]">개인정보 처리방침 (필수)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={terms.marketing}
                        onChange={(e) => handleTermChange('marketing', e.target.checked)}
                        className="w-4 h-4 rounded border border-[#888888] appearance-none checked:bg-[#FF6F0F] checked:border-[#FF6F0F] cursor-pointer"
                      />
                      {terms.marketing && (
                        <Check className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                    <span className="text-[14px] text-[#888888]">마케팅 정보 수신 (선택)</span>
                  </label>
                </div>
              )}
            </div>

            {/* Signup Button */}
            <button
              onClick={handleSignup}
              disabled={isSubmitting}
              className="w-full h-[52px] bg-[#FF6F0F] text-white rounded-[8px] font-medium hover:bg-[#FF6F0F]/90 transition-colors disabled:opacity-50"
            >
              회원가입
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 text-center">
            <p className="text-[13px] text-[#FF3B30]">{errorMessage}</p>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-[1px] bg-[#E8E8E8]" />
          <span className="text-[14px] text-[#888888]">또는</span>
          <div className="flex-1 h-[1px] bg-[#E8E8E8]" />
        </div>

        {/* Kakao Login Button */}
        <button
          onClick={() => {
            setLoginForm({ email: 'kakao@login.com', password: 'oauth' });
            setErrorMessage('');
            void (async () => {
              setIsSubmitting(true);
              try {
                await login('kakao@login.com', 'oauth');
                navigate('/auctions');
              } finally {
                setIsSubmitting(false);
              }
            })();
          }}
          disabled={isSubmitting}
          className="w-full h-[52px] bg-[#FEE500] text-[#1A1A1A] rounded-[8px] font-medium flex items-center justify-center gap-2 hover:bg-[#FEE500]/90 transition-colors disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 3C5.58172 3 2 5.89543 2 9.5C2 11.6484 3.28516 13.5312 5.26172 14.668L4.38281 17.8945C4.32031 18.1133 4.56641 18.2891 4.75391 18.168L8.60156 15.7188C9.05469 15.7773 9.52344 15.8125 10 15.8125C14.4183 15.8125 18 12.9141 18 9.3125C18 5.71094 14.4183 3 10 3Z" fill="#1A1A1A"/>
          </svg>
          카카오로 시작하기
        </button>
      </div>
    </div>
  );
}
