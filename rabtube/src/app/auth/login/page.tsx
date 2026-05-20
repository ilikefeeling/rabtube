'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, createAdminProfile } from '@/lib/firebaseService';
import { AlertCircle, Shield, Code, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
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

  const handleDevLogin = async () => {
    setLoading(true);
    setError('');
    const devEmail = 'developer@rabtube.com';
    const devPassword = 'developer123!';
    try {
      await signInWithEmailAndPassword(auth, devEmail, devPassword);
      router.push('/');
    } catch (e: any) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, devEmail, devPassword);
          await createUserProfile(cred.user.uid, {
            name: '개발자(디버그)',
            email: devEmail,
            hospital: 'RabTube 연구소',
            region: '서울',
            licenseNumber: '제00000호',
          });
          router.push('/');
        } catch (signUpError: any) {
          console.error(signUpError);
          setError(`개발자 자동 계정 생성 실패: ${signUpError.code || signUpError.message}`);
        }
      } else {
        console.error(e);
        setError(`개발자 로그인 실패: ${e.code || e.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    setError('');
    const adminEmail = 'admin@rabtube.com';
    const adminPassword = 'admin123!';
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      router.push('/');
    } catch (e: any) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
          await createAdminProfile(cred.user.uid, {
            name: '최고관리자',
            email: adminEmail,
            hospital: 'RabTube 본사',
            region: '서울',
            licenseNumber: '제99999호',
          });
          router.push('/');
        } catch (signUpError: any) {
          console.error(signUpError);
          setError(`관리자 자동 계정 생성 실패: ${signUpError.code || signUpError.message}`);
        }
      } else {
        console.error(e);
        setError(`관리자 로그인 실패: ${e.code || e.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d2137] relative flex items-center justify-center px-4 overflow-hidden">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-teal-500/10 rounded-full filter blur-[80px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full filter blur-[80px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-4xl text-white tracking-wide hover:opacity-90 transition-opacity">
            RabTube
          </Link>
          <p className="text-slate-400 text-sm mt-3 font-light tracking-wide">치과 개원의를 위한 프리미엄 케이스 플랫폼</p>
        </div>

        {/* Glassmorphic Card Container */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/30">
          <h2 className="text-xl font-semibold text-white mb-6 tracking-tight">로그인</h2>

          <div className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">이메일 주소</label>
              <input
                type="email"
                className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                placeholder="doctor@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">비밀번호</label>
              <input
                type="password"
                className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 active:scale-[0.99] text-white shadow-lg shadow-teal-500/20 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {loading ? '로그인 처리 중...' : '로그인'}
            </button>

            {/* Fast Access / Development Tools Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="bg-[#0b1b2d] px-3 text-slate-400 font-bold uppercase tracking-wider">간편 인증 (테스트용)</span>
              </div>
            </div>

            {/* Admin and Dev login actions grouped beautifully */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Administrator Quick Login */}
              <button
                onClick={handleAdminLogin}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-300 hover:from-amber-500/20 hover:to-orange-500/20 hover:border-amber-500/40 hover:text-amber-200 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                <Shield size={14} className="text-amber-400" />
                <span>관리자 로그인</span>
              </button>

              {/* Developer Quick Login */}
              <button
                onClick={handleDevLogin}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-slate-800/40 border border-white/10 text-slate-300 hover:bg-slate-700/40 hover:text-white active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                <Code size={14} className="text-teal-400" />
                <span>개발자 로그인</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center mt-6">
            아직 계정이 없으신가요?{' '}
            <Link href="/auth/register" className="text-teal-400 font-medium hover:text-teal-300 hover:underline transition-colors">
              회원가입 <ArrowRight size={12} className="inline-block" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
