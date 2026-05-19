'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/lib/AuthContext';
import {
  getAllPendingUsers, getAllUsers,
  approveUser, rejectUser, validateNameMatch,
} from '@/lib/firebaseService';
import type { UserProfile } from '@/types';
import {
  ShieldCheck, ShieldX, AlertTriangle, CheckCircle, Clock,
  Eye, ChevronDown, Search, Users, FileText,
} from 'lucide-react';

type Tab = 'pending' | 'all';

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('pending');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ uid: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 관리자가 아니면 리다이렉트
  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'admin')) {
      router.push('/');
    }
  }, [authLoading, user, profile, router]);

  // 데이터 로드
  useEffect(() => {
    if (profile?.role !== 'admin') return;
    loadUsers();
  }, [tab, profile]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = tab === 'pending' ? await getAllPendingUsers() : await getAllUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (uid: string) => {
    setActionLoading(uid);
    try {
      await approveUser(uid);
      await loadUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.uid);
    try {
      await rejectUser(rejectModal.uid, rejectReason || '서류 확인 불가');
      setRejectModal(null);
      setRejectReason('');
      await loadUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      ASSOCIATE: { label: '준회원', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      PENDING:   { label: '검토대기', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      APPROVED:  { label: '정회원', color: 'bg-teal-50 text-teal-700 border-teal-200' },
      REJECTED:  { label: '반려', color: 'bg-red-50 text-red-700 border-red-200' },
      approved:  { label: '정회원(레거시)', color: 'bg-teal-50 text-teal-700 border-teal-200' },
      pending:   { label: '대기(레거시)', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      rejected:  { label: '반려(레거시)', color: 'bg-red-50 text-red-700 border-red-200' },
    };
    const s = map[status] ?? { label: status, color: 'bg-slate-50 text-slate-600 border-slate-200' };
    return <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${s.color}`}>{s.label}</span>;
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.hospital?.toLowerCase().includes(q) ||
      u.licenseNumber?.toLowerCase().includes(q)
    );
  });

  if (authLoading || profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users size={24} className="text-teal-600" /> 회원 관리
            </h1>
            <p className="text-sm text-slate-500 mt-1">면허 검증 및 회원 승인 관리 대시보드</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1.5">
              <Clock size={14} />
              대기: {users.filter(u => u.status === 'PENDING').length}명
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === 'pending'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300'
            }`}
          >
            검토 대기
          </button>
          <button
            onClick={() => setTab('all')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === 'all'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300'
            }`}
          >
            전체 회원
          </button>
          <div className="flex-1" />
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input-field pl-9 text-sm w-60"
              placeholder="이름, 이메일, 병원명 검색"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* User List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-base font-bold text-slate-600">
              {tab === 'pending' ? '검토 대기 중인 회원이 없습니다' : '등록된 회원이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map(u => {
              const nameMatch = validateNameMatch(u);
              const isPending = u.status === 'PENDING';

              return (
                <div key={u.uid} className="card p-5 border border-slate-100/80 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-slate-700 text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {u.name?.slice(0, 1) ?? '?'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-base font-bold text-slate-900">{u.name}</p>
                        {statusLabel(u.status)}
                        {/* 이름 불일치 경고 */}
                        {!nameMatch && (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
                            <AlertTriangle size={10} /> 이름 불일치
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>{u.email}</span>
                        <span>🏥 {u.hospital}</span>
                        <span>📍 {u.region}</span>
                        <span>면허: {u.licenseNumber}</span>
                        {u.phone && <span>📱 {u.phone}</span>}
                        {u.birthdate && <span>🎂 {u.birthdate}</span>}
                      </div>

                      {/* 본인인증 이름 vs 프로필 이름 비교 */}
                      {u.verifiedName && u.verifiedName !== u.name && (
                        <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-2.5 text-xs text-red-700">
                          <p className="font-bold">⚠️ 이름 불일치 감지</p>
                          <p>본인인증 이름: <span className="font-bold">{u.verifiedName}</span> ↔ 프로필 이름: <span className="font-bold">{u.name}</span></p>
                        </div>
                      )}

                      {/* 반려 사유 */}
                      {u.status === 'REJECTED' && u.rejectionReason && (
                        <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-xs text-amber-700">
                          <p className="font-bold">반려 사유: </p>
                          <p>{u.rejectionReason}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* 면허증 미리보기 */}
                      {u.licenseFileUrl && (
                        <button
                          onClick={() => setPreviewUrl(u.licenseFileUrl!)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <FileText size={13} /> 면허증
                        </button>
                      )}

                      {isPending && (
                        <>
                          <button
                            onClick={() => handleApprove(u.uid)}
                            disabled={actionLoading === u.uid}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                          >
                            <ShieldCheck size={13} /> 승인
                          </button>
                          <button
                            onClick={() => setRejectModal({ uid: u.uid, name: u.name })}
                            disabled={actionLoading === u.uid}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <ShieldX size={13} /> 반려
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7">
            <h3 className="text-lg font-bold text-slate-900 mb-2">회원 반려</h3>
            <p className="text-sm text-slate-500 mb-4">
              <span className="font-bold text-slate-700">{rejectModal.name}</span> 님의 가입을 반려합니다.
            </p>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">반려 사유</label>
            <textarea
              className="input-field text-sm mb-4 resize-none"
              rows={3}
              placeholder="면허증 사진이 불선명합니다 / 이름이 불일치합니다 등"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="btn-secondary flex-1"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.uid}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading === rejectModal.uid ? '처리 중...' : '반려 확정'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* License Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-auto p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">면허증 미리보기</h3>
              <button onClick={() => setPreviewUrl(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                닫기 ✕
              </button>
            </div>
            {previewUrl.toLowerCase().endsWith('.pdf') ? (
              <iframe src={previewUrl} className="w-full h-[65vh] rounded-lg border border-slate-200" />
            ) : (
              <img src={previewUrl} alt="면허증" className="w-full rounded-lg border border-slate-200" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
