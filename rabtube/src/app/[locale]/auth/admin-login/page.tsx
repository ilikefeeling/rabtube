'use client';

import { useState } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [passkey, setPasskey] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to login');

      await signInWithCustomToken(auth, data.token);
      router.push('/admin/users');
    } catch (error: any) {
      alert(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d2137] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <span className="font-serif text-4xl text-white font-bold">RabTube</span>
          <p className="text-slate-400 text-sm mt-3">최고관리자 로그인</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">관리자 접속</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                관리자 Passkey
              </label>
              <input 
                type="password" 
                value={passkey}
                onChange={e => setPasskey(e.target.value)}
                placeholder="Passkey를 입력하세요"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-teal-600 text-white font-bold py-3.5 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {loading ? '인증 중...' : '로그인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
