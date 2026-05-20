'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Coins, TrendingUp, TrendingDown, Clock,
  RefreshCw, ChevronRight, AlertTriangle, CheckCircle,
  Search, Filter, MoreVertical, Zap, ShieldCheck, ShieldX,
  FileText, Eye, ChevronDown, Award
} from 'lucide-react';
import Header from '@/components/Header';
import StatCard from '@/components/admin/StatCard';
import AdjustModal from '@/components/admin/AdjustModal';
import { useAuth } from '@/lib/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import {
  confirmAllPendingTransactions,
  type MemberWithBalance
} from '@/lib/adminService';
import {
  approveUser,
  rejectUser,
  validateNameMatch
} from '@/lib/firebaseService';
import type { PointTxType } from '@/types';

type Tab = 'pending' | 'overview' | 'members' | 'txs' | 'supply';

const TX_LABELS: Record<PointTxType, string> = {
  SIGNUP_BONUS:         '가입 보너스',
  UPLOAD_REWARD:        '업로드 보상',
  UPLOAD_QUALITY_BONUS: '품질 보너스',
  LIKE_RECEIVED:        '좋아요 수신',
  VIEW_SHARE:           '시청료 수익',
  VIEW_SPEND:           '케이스 시청',
  DOWNLOAD_SPEND:       '다운로드',
  BOOST_SPEND:          '피드 부스트',
  ADMIN_GRANT:          '관리자 지급',
  ADMIN_DEDUCT:         '관리자 차감',
  REPORT_REWARD:        '신고 보상',
  PENALTY_DEDUCT:       '패널티',
};

const TX_COLOR: Record<string, string> = {
  SIGNUP_BONUS: 'text-teal-600 font-semibold',
  UPLOAD_REWARD: 'text-teal-600 font-semibold',
  UPLOAD_QUALITY_BONUS: 'text-teal-600 font-semibold',
  LIKE_RECEIVED: 'text-teal-600 font-semibold',
  VIEW_SHARE: 'text-teal-600 font-semibold',
  ADMIN_GRANT: 'text-blue-600 font-semibold',
  REPORT_REWARD: 'text-teal-600 font-semibold',
  VIEW_SPEND: 'text-red-500 font-semibold',
  DOWNLOAD_SPEND: 'text-red-500 font-semibold',
  BOOST_SPEND: 'text-red-500 font-semibold',
  ADMIN_DEDUCT: 'text-red-500 font-semibold',
  PENALTY_DEDUCT: 'text-red-500 font-semibold',
};

const fmt = (n: number) => {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n ?? 0));
};

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { stats, members, recentTxs, loading, error, refresh, isAdmin } = useAdmin();

  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectModal, setRejectModal] = useState<{ uid: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<MemberWithBalance | null>(null);
  const [confirmingPending, setConfirmingPending] = useState(false);
  const [confirmResult, setConfirmResult] = useState('');

  // 권한 비인가 유저 리다이렉트
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, authLoading, isAdmin, router]);

  // 전체 트랜잭션 펜딩 일괄 확정 처리
  const handleConfirmPending = async () => {
    setConfirmingPending(true);
    try {
      const n = await confirmAllPendingTransactions();
      setConfirmResult(`${n}건 확정 완료`);
      refresh();
      setTimeout(() => setConfirmResult(''), 3000);
    } catch (e: any) {
      setConfirmResult(`오류: ${e.message}`);
    } finally {
      setConfirmingPending(false);
    }
  };

  // 회원가입 정회원 승인
  const handleApproveUser = async (uid: string) => {
    setActionLoading(uid);
    try {
      await approveUser(uid);
      await refresh();
    } catch (e) {
      console.error('승인 중 오류 발생:', e);
    } finally {
      setActionLoading(null);
    }
  };

  // 회원가입 가입 심사 반려
  const handleRejectUser = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.uid);
    try {
      await rejectUser(rejectModal.uid, rejectReason || '서류 확인 불가');
      setRejectModal(null);
      setRejectReason('');
      await refresh();
    } catch (e) {
      console.error('반려 중 오류 발생:', e);
    } finally {
      setActionLoading(null);
    }
  };

  // 회원 정지 조치
  const handleSuspendUser = async (uid: string) => {
    setActionLoading(uid);
    try {
      await rejectUser(uid, '관리자 직권에 따른 회원 정지 조치');
      await refresh();
    } catch (e) {
      console.error('회원 정지 중 오류 발생:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const fmtTime = (d: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d instanceof Date ? d : new Date(d));
  };

  // 가입 대기 회원 필터 (status가 대소문자 구분 없이 PENDING 인 대상)
  const pendingMembers = members.filter(m => m.status?.toUpperCase() === 'PENDING');

  // 검색 쿼리에 따른 회원 필터
  const filteredMembers = members.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.hospital?.toLowerCase().includes(q) ||
      m.licenseNumber?.toLowerCase().includes(q)
    );
  });

  const filteredPendingMembers = pendingMembers.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.hospital?.toLowerCase().includes(q) ||
      m.licenseNumber?.toLowerCase().includes(q)
    );
  });

  // 상태 뱃지 라벨
  const renderStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'APPROVED') {
      return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-teal-50 text-teal-700 border-teal-200">정회원</span>;
    }
    if (s === 'PENDING') {
      return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200">검토대기</span>;
    }
    if (s === 'REJECTED') {
      return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-red-50 text-red-700 border-red-200">반려</span>;
    }
    if (s === 'ASSOCIATE') {
      return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">준회원</span>;
    }
    return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-slate-50 text-slate-600 border-slate-200">{status}</span>;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const TABS = [
    { id: 'pending',  label: `가입 대기 (${pendingMembers.length})` },
    { id: 'overview', label: '포인트 개요' },
    { id: 'members',  label: `전체 회원 (${members.length})` },
    { id: 'txs',      label: '트랜잭션 조회' },
    { id: 'supply',   label: 'RAB 공급현황' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Admin Executive Top Bar */}
      <div className="bg-[#0d2137] border-t border-white/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-11 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Zap size={13} className="text-amber-400 animate-pulse" />
            <span className="text-amber-400 font-bold tracking-wider">ADMIN CONSOLE</span>
            <span>·</span>
            <span className="font-semibold text-slate-300">{profile?.name} 관리자 계정</span>
          </div>
          <div className="flex items-center gap-3">
            {confirmResult && (
              <span className="text-xs text-teal-400 font-bold transition-all animate-bounce">{confirmResult}</span>
            )}
            <button
              onClick={handleConfirmPending}
              disabled={confirmingPending}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-lg transition-colors font-semibold disabled:opacity-50"
            >
              <CheckCircle size={12} />
              {confirmingPending ? '처리 중...' : `Pending 확정 (${stats?.pendingTxCount ?? 0}건)`}
            </button>
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-lg transition-colors font-semibold"
            >
              <RefreshCw size={12} />
              새로고침
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users size={24} className="text-teal-600" /> RabTube 시스템 관리자
            </h1>
            <p className="text-sm text-slate-500 mt-1">면허증 검증, 회원 밸런스 조정 및 RAB 토큰 이코노미 실시간 모니터링</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm">
            <Clock size={15} />
            가입 대기: {pendingMembers.length}명
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6 border border-red-100 shadow-sm">
            <AlertTriangle size={15} />
            {error}
          </div>
        )}

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            label="총 유통 RAB"
            value={fmt(stats?.totalSupply ?? 0)}
            sub={`평균 ${fmt(stats?.avgBalance ?? 0)} RAB / 회원`}
            color="#7c5cbf"
            icon={<Coins size={16} />}
          />
          <StatCard
            label="누적 발행 RAB"
            value={fmt(stats?.totalEverIssued ?? 0)}
            sub={`소각 ${fmt(stats?.totalEverBurned ?? 0)} RAB`}
            color="#1a9e75"
            icon={<Award size={16} />}
          />
          <StatCard
            label="플랫폼 누적 수익"
            value={fmt(stats?.totalPlatformRevenue ?? 0)}
            sub={`오늘 트랜잭션 ${stats?.todayTxCount ?? 0}건`}
            color="#2c7be5"
            icon={<TrendingUp size={16} />}
          />
          <StatCard
            label="전체 회원"
            value={fmt(stats?.totalMembers ?? 0)}
            sub={`등록 케이스 ${fmt(stats?.totalCases ?? 0)}개`}
            color="#d4920c"
            icon={<Users size={16} />}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as Tab)}
              className={`px-5 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
                activeTab === t.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: PENDING (가입 검토 대기) ── */}
        {activeTab === 'pending' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700">신규 가입 면허 심사 대기 목록</h3>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input-field pl-9 text-xs w-60 py-1.5"
                  placeholder="대기자 이름, 병원명 검색"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {filteredPendingMembers.length === 0 ? (
              <div className="card p-16 text-center shadow-sm">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-base font-bold text-slate-600">가입 검토 대기 중인 회원이 없습니다</p>
                <p className="text-xs text-slate-400 mt-1">새로운 면허 인증 대기자가 발생하면 여기에 노출됩니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPendingMembers.map(u => {
                  const nameMatch = validateNameMatch(u);
                  return (
                    <div key={u.uid} className="card p-5 border border-slate-100 hover:shadow-md transition-all shadow-sm">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-slate-700 text-white text-base font-bold flex items-center justify-center shrink-0 shadow-inner">
                          {u.name?.slice(0, 1) ?? '?'}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <p className="text-base font-bold text-slate-900">{u.name}</p>
                            {renderStatusBadge(u.status)}
                            {/* 이름 불일치 경고 */}
                            {!nameMatch && (
                              <span className="flex items-center gap-1 text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
                                <AlertTriangle size={10} /> 이름 불일치
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium">
                            <span>{u.email}</span>
                            <span>🏥 {u.hospital}</span>
                            <span>📍 {u.region}</span>
                            <span>면허: {u.licenseNumber}</span>
                            {u.phone && <span>📱 {u.phone}</span>}
                            {u.birthdate && <span>🎂 {u.birthdate}</span>}
                          </div>

                          {/* 본인인증 이름 vs 프로필 이름 대조 경고 디테일 */}
                          {u.verifiedName && u.verifiedName !== u.name && (
                            <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-700 shadow-sm">
                              <p className="font-bold flex items-center gap-1">
                                <AlertTriangle size={12} /> 실명 검증 불일치 알림
                              </p>
                              <p className="mt-1">
                                본인인증 이름: <span className="font-bold underline">{u.verifiedName}</span> ↔ 프로필 설정 이름: <span className="font-bold underline">{u.name}</span>
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-center">
                          {u.licenseFileUrl && (
                            <button
                              onClick={() => setPreviewUrl(u.licenseFileUrl!)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
                            >
                              <FileText size={13} /> 면허증 확인
                            </button>
                          )}
                          <button
                            onClick={() => handleApproveUser(u.uid)}
                            disabled={actionLoading === u.uid}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 shadow-sm"
                          >
                            <ShieldCheck size={13} /> 승인
                          </button>
                          <button
                            onClick={() => setRejectModal({ uid: u.uid, name: u.name })}
                            disabled={actionLoading === u.uid}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 shadow-sm"
                          >
                            <ShieldX size={13} /> 반려
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: OVERVIEW (포인트 현황 개요) ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            {/* RAB 공급 유통 구성 */}
            <div className="card p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-4">RAB 토큰 공급 구조</h3>
              {[
                {
                  label: '유통 중 (정회원 확정 잔고 합계)',
                  val: stats?.totalSupply ?? 0,
                  color: '#7c5cbf',
                  pct: stats ? Math.round((stats.totalSupply / Math.max(stats.totalEverIssued, 1)) * 100) : 0
                },
                {
                  label: '누적 소각 (케이스 시청 및 다운로드 소비)',
                  val: stats?.totalEverBurned ?? 0,
                  color: '#e24b4a',
                  pct: stats ? Math.round((stats.totalEverBurned / Math.max(stats.totalEverIssued, 1)) * 100) : 0
                },
                {
                  label: '플랫폼 누적 배분 수익',
                  val: stats?.totalPlatformRevenue ?? 0,
                  color: '#1a9e75',
                  pct: stats ? Math.round((stats.totalPlatformRevenue / Math.max(stats.totalEverIssued, 1)) * 100) : 0
                },
              ].map(r => (
                <div key={r.label} className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-semibold">{r.label}</span>
                    <span className="font-bold text-slate-700">{fmt(r.val)} RAB ({r.pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${r.pct}%`, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* 대기 현황 지표 */}
            <div className="card p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-4">운영 및 트래픽 현황</h3>
              <div className="space-y-4">
                {[
                  { label: '승인 대기 트랜잭션 (Pending)', val: `${stats?.pendingTxCount ?? 0}건`, icon: <Clock size={15} />, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { label: '오늘 발생 트랜잭션', val: `${stats?.todayTxCount ?? 0}건`, icon: <TrendingUp size={15} />, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { label: '전체 유저 규모', val: `${stats?.totalMembers ?? 0}명`, icon: <Users size={15} />, color: 'text-teal-600', bg: 'bg-teal-50' },
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-3.5 p-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${r.bg} ${r.color}`}>
                      {r.icon}
                    </div>
                    <span className="text-sm text-slate-600 font-semibold flex-1">{r.label}</span>
                    <span className="text-sm font-bold text-slate-800">{r.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 최근 트랜잭션 미리보기 */}
            <div className="card col-span-2 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700">최근 트랜잭션 요약 (실시간 동기화)</h3>
                <button onClick={() => setActiveTab('txs')} className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1">
                  전체 내역 보기 <ChevronRight size={13} />
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {recentTxs.slice(0, 8).map(tx => (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/70 transition-colors">
                    <div className={`text-xs font-semibold w-24 shrink-0 ${TX_COLOR[tx.type] ?? 'text-slate-500'}`}>
                      {TX_LABELS[tx.type]}
                    </div>
                    <div className="text-xs text-slate-500 truncate flex-1 font-medium">{tx.description}</div>
                    <div className={`text-xs font-bold w-24 text-right shrink-0 ${tx.amount > 0 ? 'text-teal-600' : 'text-red-500'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} RAB
                    </div>
                    <div className="text-[11px] text-slate-300 w-28 text-right shrink-0 font-medium">
                      {fmtTime(tx.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: MEMBERS (전체 회원 관리) ── */}
        {activeTab === 'members' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="input-field pl-9 text-xs w-60 py-1.5"
                    placeholder="이름, 병원명, 이메일 검색"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <span className="text-xs text-slate-400 font-semibold">{filteredMembers.length}명의 회원</span>
              </div>
            </div>

            <div className="card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['의사 정보', '소속 병원', '활동 지역', '확정 잔액', '누적 획득', '누적 소비', '승인 상태', '작업'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredMembers.map(m => (
                      <tr key={m.uid} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-700 text-blue-300 text-xs font-bold flex items-center justify-center shrink-0 shadow-inner">
                              {m.name?.slice(0, 1)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{m.name}</p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600 font-semibold">{m.hospital}</td>
                        <td className="px-5 py-3 text-xs text-slate-500 font-semibold">{m.region}</td>
                        <td className="px-5 py-3">
                          <span className="text-sm font-bold text-slate-800">{fmt(m.balance)}</span>
                          <span className="text-[10px] text-amber-500 font-bold ml-1">RAB</span>
                          {m.pendingBalance > 0 && (
                            <span className="text-[10px] text-amber-400 font-semibold ml-1">(+{fmt(m.pendingBalance)}↻)</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-teal-600 font-bold">+{fmt(m.totalEarned)}</td>
                        <td className="px-5 py-3 text-xs text-red-400 font-bold">-{fmt(m.totalSpent)}</td>
                        <td className="px-5 py-3">
                          {renderStatusBadge(m.status)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setAdjustTarget(m)}
                              className="text-[11px] px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors font-bold shadow-sm"
                            >
                              RAB 조정
                            </button>
                            {m.status?.toUpperCase() !== 'APPROVED' ? (
                              <button
                                onClick={() => handleApproveUser(m.uid)}
                                disabled={actionLoading === m.uid}
                                className="text-[11px] px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-bold shadow-sm disabled:opacity-40"
                              >
                                승인
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspendUser(m.uid)}
                                disabled={actionLoading === m.uid}
                                className="text-[11px] px-2.5 py-1 rounded-md bg-red-50 text-red-500 hover:bg-red-100 transition-colors font-bold shadow-sm disabled:opacity-40"
                              >
                                정지
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: TXS (트랜잭션 조회) ── */}
        {activeTab === 'txs' && (
          <div className="card overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700">전체 실시간 트랜잭션 대장 (최근 50건)</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-[10px] text-teal-600 font-bold tracking-wider uppercase">Live Sync</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['발생 시각', '보상 유형', '조정 수량', '잔액 결과', '승인 단계', '상세 설명', '유저 ID'].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-bold text-[10px] text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {recentTxs.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{fmtTime(tx.createdAt)}</td>
                      <td className={`px-5 py-3 whitespace-nowrap ${TX_COLOR[tx.type] ?? 'text-slate-500'}`}>
                        {TX_LABELS[tx.type]}
                      </td>
                      <td className={`px-5 py-3 font-bold whitespace-nowrap ${tx.amount > 0 ? 'text-teal-600' : 'text-red-500'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount} RAB
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-bold">{tx.balanceAfter} RAB</td>
                      <td className="px-5 py-3">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                          tx.status === 'confirmed' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                          tx.status === 'pending'   ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-red-50 text-red-500 border-red-200'
                        }`}>{tx.status}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 max-w-[240px] truncate">{tx.description}</td>
                      <td className="px-5 py-3 text-slate-300 font-mono text-[10px]">{tx.userId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 5: SUPPLY (RAB 공급 현황) ── */}
        {activeTab === 'supply' && (
          <div className="grid grid-cols-3 gap-6">
            {[
              {
                label: '토큰 소각률 (소비/발행 비율)',
                val: stats ? `${Math.round((stats.totalEverBurned / Math.max(stats.totalEverIssued, 1)) * 100)}%` : '-',
                good: stats ? (stats.totalEverBurned / Math.max(stats.totalEverIssued, 1)) >= 0.15 : false,
                desc: '권장 목표: 15% 이상 수치 유지'
              },
              {
                label: '실질 유통 공급량',
                val: fmt(stats?.totalSupply ?? 0) + ' RAB',
                good: true,
                desc: '의사 회원 지갑 내 확정 토큰 총량'
              },
              {
                label: '1인당 평균 보유 잔액',
                val: fmt(stats?.avgBalance ?? 0) + ' RAB',
                good: stats ? (stats.avgBalance ?? 0) >= 25 : false,
                desc: '최저 권장 수치: 25 RAB 이상 유지'
              },
            ].map(r => (
              <div key={r.label} className="card p-6 shadow-sm border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">{r.label}</p>
                <p className={`text-3xl font-bold mb-1.5 ${r.good ? 'text-teal-600' : 'text-red-500'}`}>{r.val}</p>
                <p className="text-xs text-slate-400 font-medium">{r.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Reject Reason Modal (반려 사유 입력) */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 border border-slate-100" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">가입 승인 반려</h3>
            <p className="text-sm text-slate-500 mb-4">
              <span className="font-bold text-slate-700 underline">{rejectModal.name}</span> 원장님의 가입 요청을 반려합니다.
            </p>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">구체적인 반려 사유 기입</label>
            <textarea
              className="input-field text-sm mb-4 resize-none"
              rows={3}
              placeholder="예: 면허증 식별이 어렵습니다. 면허번호와 면허증 상 정보가 일치하지 않습니다 등"
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
                onClick={handleRejectUser}
                disabled={actionLoading === rejectModal.uid}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
              >
                {actionLoading === rejectModal.uid ? '처리 중...' : '반려 확정'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* License Preview Modal (면허 이미지 미리보기) */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-auto p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-teal-600" /> 제출 면허 증빙 서류 미리보기
              </h3>
              <button onClick={() => setPreviewUrl(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                닫기 ✕
              </button>
            </div>
            {previewUrl.toLowerCase().endsWith('.pdf') ? (
              <iframe src={previewUrl} className="w-full h-[65vh] rounded-lg border border-slate-200 shadow-inner" />
            ) : (
              <img src={previewUrl} alt="면허 증빙 자료" className="w-full rounded-lg border border-slate-200 shadow-inner" />
            )}
          </div>
        </div>
      )}

      {/* RAB 수동 포인트 조정 모달 */}
      {adjustTarget && (
        <AdjustModal
          member={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onDone={refresh}
        />
      )}
    </div>
  );
}
