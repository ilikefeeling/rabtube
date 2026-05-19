'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile } from '@/lib/firebaseService';
import { AlertCircle } from 'lucide-react';

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
      // 만약 계정이 존재하지 않는다면 자동으로 회원가입 및 프로필 생성 진행
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
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">비밀번호</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
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

            {/* Developer Fast Access Option */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-[10px] text-slate-400 uppercase tracking-wider">Developer Tool</span>
              </div>
            </div>

            <button
              onClick={handleDevLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-all cursor-pointer"
            >
              🛠️ 개발자 계정으로 즉시 로그인
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

