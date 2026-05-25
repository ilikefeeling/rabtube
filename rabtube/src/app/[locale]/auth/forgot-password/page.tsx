'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError('이메일을 입력해 주세요');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (e: any) {
      const msg: Record<string, string> = {
        'auth/invalid-email': '유효하지 않은 이메일 형식입니다',
        'auth/user-not-found': '등록되지 않은 이메일입니다',
      };
      setError(msg[e.code] ?? '비밀번호 재설정 메일 전송 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d2137] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-serif text-3xl text-white">RabTube</span>
          <p className="text-slate-400 text-sm mt-2">치과 개원의 케이스 플랫폼</p>
        </div>

        <div className="bg-white rounded-2xl p-7">
          <h2 className="text-base font-medium text-slate-800 mb-2">비밀번호 찾기</h2>
          <p className="text-xs text-slate-400 mb-5">가입하신 이메일로 비밀번호 재설정 링크를 보내드립니다</p>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">이메일</label>
              <input
                type="email"
                className="input-field"
                placeholder="doctor@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                disabled={loading || success}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 text-xs p-3 rounded-lg">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2 bg-teal-50 text-teal-700 text-xs p-3 rounded-lg leading-relaxed">
                <CheckCircle size={14} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">이메일 전송 완료!</p>
                  <p className="text-[11px] text-teal-600 mt-0.5">입력하신 메일함으로 재설정 메일이 발송되었습니다. 메일 내부의 링크를 통해 비밀번호를 재설정해 주세요.</p>
                </div>
              </div>
            )}

            <button 
              onClick={handleResetPassword} 
              disabled={loading || success} 
              className="btn-primary w-full"
            >
              {loading ? '전송 중...' : '비밀번호 재설정 메일 전송'}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-400">
            <Link href="/auth/login" className="flex items-center gap-1 hover:text-slate-600 transition-colors">
              <ArrowLeft size={12} /> 로그인으로 돌아가기
            </Link>
            <Link href="/auth/register" className="text-teal-600 font-medium hover:underline">
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
