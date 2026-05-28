'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function KakaoSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('인증 토큰이 없습니다. 다시 시도해 주세요.');
      setTimeout(() => router.push('/auth/login'), 2000);
      return;
    }

    const completeLogin = async () => {
      try {
        const userCredential = await signInWithCustomToken(auth, token);
        const user = userCredential.user;

        // Check user status in Firestore
        const docRef = doc(db, 'ci_values', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const status = docSnap.data().status;
          if (status === 'approved') {
            router.push('/');
          } else {
            router.push('/dashboard/verify');
          }
        } else {
          // If no doc exists for some reason, push to verify
          router.push('/dashboard/verify');
        }

      } catch (err) {
        console.error('Custom token sign in failed:', err);
        setError('카카오 로그인 연동에 실패했습니다.');
        setTimeout(() => router.push('/auth/login'), 2000);
      }
    };

    completeLogin();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-[#0d2137] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        {!error ? (
          <>
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-medium text-white mb-2">카카오 로그인 처리 중...</h2>
            <p className="text-slate-400 text-sm">잠시만 기다려 주세요.</p>
          </>
        ) : (
          <>
            <div className="text-red-400 text-5xl mb-4">!</div>
            <h2 className="text-xl font-medium text-white mb-2">로그인 실패</h2>
            <p className="text-slate-400 text-sm">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}
