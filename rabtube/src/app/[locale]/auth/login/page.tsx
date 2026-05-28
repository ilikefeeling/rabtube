'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) return;
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      router.push('/');
    } catch (e: any) {
      const msg: Record<string, string> = {
        'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다',
        'auth/user-not-found': '등록되지 않은 이메일입니다',
        'auth/wrong-password': '비밀번호가 올바르지 않습니다',
        'auth/too-many-requests': '너무 많은 시도입니다. 잠시 후 다시 시도해 주세요',
      };
      setError(msg[e.code] ?? '로그인 중 오류가 발생했습니다');
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
          <h2 className="text-base font-medium text-slate-800 mb-5">로그인</h2>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">이메일</label>
              <input
                type="email"
                className="input-field"
                placeholder="doctor@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="username"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block">비밀번호</label>
                <Link href="/auth/forgot-password" className="text-[10px] text-teal-600 hover:underline">
                  비밀번호 찾기
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 text-xs p-3 rounded-lg">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button onClick={handleLogin} disabled={loading} className="btn-primary w-full">
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center mt-5">
            아직 계정이 없으신가요?{' '}
            <Link href="/auth/register" className="text-teal-600 font-medium hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
