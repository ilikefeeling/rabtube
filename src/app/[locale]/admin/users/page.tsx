'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { getAllUsers, updateUserStatus } from '@/lib/firebaseService';
import type { UserProfile } from '@/types';
import { Loader2, CheckCircle, XCircle, Search, ExternalLink } from 'lucide-react';

export default function AdminUsersPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user || profile?.role !== 'admin') {
        router.push('/');
      } else {
        fetchUsers();
      }
    }
  }, [user, profile, authLoading, router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (filter === 'all') return true;
    return u.status === filter;
  });

  const handleApprove = async (userId: string) => {
    if (!confirm('해당 유저를 정회원으로 승인하시겠습니까?')) return;
    setIsUpdating(true);
    try {
      await updateUserStatus(userId, 'approved');
      alert('승인되었습니다.');
      setSelectedUser(null);
      fetchUsers();
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectionReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }
    if (!confirm('해당 유저의 가입을 반려하시겠습니까?')) return;
    setIsUpdating(true);
    try {
      await updateUserStatus(userId, 'rejected', rejectionReason);
      alert('반려되었습니다.');
      setSelectedUser(null);
      setRejectionReason('');
      fetchUsers();
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">회원 승인 관리</h1>
      
      {/* 필터 탭 */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-hide">
        {[
          { id: 'pending', label: '대기 중 (면허증 검토)' },
          { id: 'associate', label: '가입완료 (면허미제출)' },
          { id: 'approved', label: '승인됨 (정회원)' },
          { id: 'rejected', label: '반려됨' },
          { id: 'all', label: '전체' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === tab.id
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 리스트 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-medium">가입일</th>
                <th className="p-4 font-medium">이름(실명)</th>
                <th className="p-4 font-medium">이메일</th>
                <th className="p-4 font-medium">병원명</th>
                <th className="p-4 font-medium">면허번호</th>
                <th className="p-4 font-medium">상태</th>
                <th className="p-4 font-medium text-center">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-slate-500">
                    해당하는 유저가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.uid} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-sm text-slate-600">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-medium text-slate-800">
                      {u.name}
                      {u.ciName && u.name !== u.ciName && (
                        <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">불일치</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-600">{u.email}</td>
                    <td className="p-4 text-sm text-slate-600">{u.hospital}</td>
                    <td className="p-4 text-sm text-slate-600">{u.licenseNumber}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.status === 'approved' ? 'bg-green-100 text-green-700' :
                        u.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        u.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        상세/검토
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 모달 */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800">회원 상세 검토</h2>
              <button onClick={() => { setSelectedUser(null); setRejectionReason(''); }} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 유저 정보 */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">가입 정보</h3>
                  <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
                    <p><span className="text-slate-500 w-24 inline-block">이름:</span> <strong>{selectedUser.name}</strong></p>
                    <p><span className="text-slate-500 w-24 inline-block">본인인증 실명:</span> <strong>{selectedUser.ciName || '-'}</strong></p>
                    <p><span className="text-slate-500 w-24 inline-block">이메일:</span> {selectedUser.email}</p>
                    <p><span className="text-slate-500 w-24 inline-block">휴대폰:</span> {selectedUser.phoneNumber}</p>
                    <p><span className="text-slate-500 w-24 inline-block">생년월일:</span> {selectedUser.birthdate}</p>
                    <p><span className="text-slate-500 w-24 inline-block">병원명:</span> {selectedUser.hospital}</p>
                    <p><span className="text-slate-500 w-24 inline-block">지역:</span> {selectedUser.region}</p>
                    <p><span className="text-slate-500 w-24 inline-block">면허번호:</span> <strong className="text-teal-600">{selectedUser.licenseNumber}</strong></p>
                  </div>
                </div>

                {selectedUser.status === 'pending' && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <h3 className="text-sm font-medium text-slate-500 mb-2">승인/반려 처리</h3>
                    <input
                      type="text"
                      placeholder="반려 사유 입력 (예: 면허증 사진 흐림)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(selectedUser.uid)}
                        disabled={isUpdating}
                        className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg font-medium text-sm transition-colors"
                      >
                        반려하기
                      </button>
                      <button
                        onClick={() => handleApprove(selectedUser.uid)}
                        disabled={isUpdating}
                        className="flex-1 bg-teal-600 text-white hover:bg-teal-700 py-2 rounded-lg font-medium text-sm transition-colors"
                      >
                        승인하기
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 면허증 이미지 */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center justify-between">
                  면허증 사본
                  {selectedUser.licenseUrl && (
                    <a href={selectedUser.licenseUrl} target="_blank" rel="noreferrer" className="text-teal-600 flex items-center gap-1 text-xs hover:underline">
                      원본 보기 <ExternalLink size={12} />
                    </a>
                  )}
                </h3>
                <div className="bg-slate-100 rounded-xl overflow-hidden aspect-[3/4] flex items-center justify-center border border-slate-200 relative">
                  {selectedUser.licenseUrl ? (
                    <img 
                      src={selectedUser.licenseUrl} 
                      alt="면허증 사본" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <p className="text-slate-400 text-sm">제출된 면허증이 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
