'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Header from '@/components/Header';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Shield, UserCheck, RefreshCw, Key, ShieldAlert } from 'lucide-react';

export default function TestHelperPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const updateProfileFields = async (fields: any) => {
    if (!user) {
      setMsg('로그인이 필요합니다.');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, fields);
      await refreshProfile();
      setMsg('성공적으로 변경되었습니다!');
    } catch (e: any) {
      setMsg(`변경 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-xl mx-auto px-6 py-12">
        <div className="card p-8 border border-slate-200/60 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">검증 헬퍼 (Test Helper)</h1>
              <p className="text-xs text-slate-500 font-medium">유저 권한 및 상태 강제 시뮬레이션</p>
            </div>
          </div>

          {!user ? (
            <div className="text-center py-6">
              <p className="text-sm font-bold text-slate-600 mb-4">로그인한 유저가 없습니다.</p>
              <a href="/auth/login" className="btn-primary inline-block px-5 py-2 rounded-xl text-sm font-bold">
                로그인 페이지로 이동
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current User State */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                <h3 className="text-xs font-bold text-slate-400 mb-3 tracking-wide uppercase">현재 로그인 정보</h3>
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs font-semibold text-slate-700">
                  <div>이름: <span className="font-bold text-slate-900">{profile?.name || '없음'}</span></div>
                  <div>이메일: <span className="font-bold text-slate-900">{user.email}</span></div>
                  <div>상태: <span className="font-extrabold text-teal-600">{profile?.status || '없음'}</span></div>
                  <div>역할: <span className="font-extrabold text-indigo-600">{profile?.role || '없음'}</span></div>
                  <div className="col-span-2">UID: <span className="font-mono text-[10px] text-slate-400">{user.uid}</span></div>
                </div>
                <button
                  onClick={() => refreshProfile()}
                  className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 font-bold transition-colors"
                >
                  <RefreshCw size={12} /> 정보 새로고침
                </button>
              </div>

              {/* Status Simulation */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 tracking-wide uppercase">1. 면허 승인 상태 시뮬레이션</h3>
                <div className="grid grid-cols-2 gap-2">

                  <button
                    onClick={() => updateProfileFields({ status: 'pending', rejectionReason: '' })}
                    disabled={loading}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 border ${
                      profile?.status === 'pending'
                        ? 'bg-blue-100 border-blue-400 text-blue-800 ring-2 ring-blue-400/10'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-slate-50'
                    }`}
                  >
                    PENDING (검토대기)
                  </button>
                  <button
                    onClick={() => updateProfileFields({ status: 'rejected', rejectionReason: '제출된 면허증 사진이 흐릿하여 식별 불가합니다.' })}
                    disabled={loading}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 border ${
                      profile?.status === 'rejected'
                        ? 'bg-red-100 border-red-400 text-red-800 ring-2 ring-red-400/10'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-red-400 hover:bg-slate-50'
                    }`}
                  >
                    REJECTED (반려)
                  </button>
                  <button
                    onClick={() => updateProfileFields({ status: 'approved', rejectionReason: '' })}
                    disabled={loading}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 border ${
                      profile?.status === 'approved'
                        ? 'bg-teal-100 border-teal-400 text-teal-800 ring-2 ring-teal-400/10'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-teal-400 hover:bg-slate-50'
                    }`}
                  >
                    APPROVED (정회원)
                  </button>
                </div>
              </div>

              {/* Role Simulation */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 tracking-wide uppercase">2. 역할(Role) 시뮬레이션</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateProfileFields({ role: 'admin' })}
                    disabled={loading}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 border ${
                      profile?.role === 'admin'
                        ? 'bg-indigo-600 border-indigo-600 text-white font-extrabold ring-2 ring-indigo-400/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-slate-50'
                    }`}
                  >
                    <Key size={13} /> 관리자(admin) 지정
                  </button>
                  <button
                    onClick={() => updateProfileFields({ role: 'user' })}
                    disabled={loading}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 border ${
                      profile?.role === 'user' || !profile?.role
                        ? 'bg-slate-200 border-slate-400 text-slate-800 font-extrabold ring-2 ring-slate-400/10'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    일반 유저(user) 지정
                  </button>
                </div>
              </div>

              {/* Log Message */}
              {msg && (
                <div className="bg-teal-50 border border-teal-150 text-teal-700 text-xs p-3.5 rounded-xl font-semibold text-center">
                  {msg}
                </div>
              )}

              {/* Admin Panel Direct Link */}
              {profile?.role === 'admin' && (
                <a
                  href="/admin"
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 rounded-xl transition-colors shadow-md mt-6"
                >
                  <ShieldAlert size={16} /> 회원 승인 대시보드(/admin) 바로가기
                </a>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
