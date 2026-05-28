'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'kakao_login_failed': return '카카오 로그인에 실패했습니다.';
      case 'kakao_token_error': return '카카오 인증 토큰을 받아오지 못했습니다.';
      case 'kakao_profile_error': return '카카오 프로필 정보를 가져오지 못했습니다.';
      case 'server_error': return '서버 처리 중 오류가 발생했습니다.';
      default: return '로그인 중 오류가 발생했습니다.';
    }
  };

  return (
    <div className="min-h-screen bg-[#0d2137] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="font-serif text-4xl text-white font-bold">RabTube</span>
          <p className="text-slate-400 text-sm mt-3">치과의사 전용 임상 영상 플랫폼</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-slate-900 mb-2 text-center">시작하기</h2>
          <p className="text-sm text-slate-500 mb-8 text-center">
            RabTube는 치과의사 면허 인증 후<br />이용 가능한 폐쇄형 커뮤니티입니다.
          </p>

          <div className="space-y-4">
            <button
              onClick={() => { window.location.href = '/api/auth/kakao/login'; }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: '#FEE500', color: '#000000' }}
            >
              <svg viewBox="0 0 32 32" className="w-6 h-6">
                <path d="M16 4.64C9.23 4.64 3.75 9.1 3.75 14.6c0 3.52 2.29 6.62 5.76 8.36L8.43 27c-.06.2.02.42.2.53.18.1.4.08.56-.05l4.83-3.23c.64.09 1.3.14 1.98.14 6.77 0 12.25-4.46 12.25-9.96S22.77 4.64 16 4.64z" fill="#000000"/>
              </svg>
              카카오로 3초 만에 시작하기
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium">
              {getErrorMessage(error)}
            </div>
          )}

          <div className="mt-6 bg-slate-50 rounded-lg p-4 text-[11px] text-slate-500 leading-relaxed text-center">
            가입 시 이용약관에 동의하는 것으로 간주되며,<br />치과의사 면허 인증 후 정식 활동이 가능합니다.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d2137] flex items-center justify-center" />}>
      <LoginContent />
    </Suspense>
  );
}
