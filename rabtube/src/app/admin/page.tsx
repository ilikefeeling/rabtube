'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Coins, TrendingUp, TrendingDown, Clock,
  RefreshCw, ChevronRight, AlertTriangle, CheckCircle,
  Search, Filter, MoreVertical, Zap,
} from 'lucide-react';
import Header from '@/components/Header';
import StatCard from '@/components/admin/StatCard';
import AdjustModal from '@/components/admin/AdjustModal';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAdmin } from '@/hooks/useAdmin';
import {
  updateMemberStatus,
  confirmAllPendingTransactions,
  type MemberWithBalance,
} from '@/lib/adminService';
import type { PointTxType } from '@/types';

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
  RAB_PURCHASE:         'RAB 충전',
};

const TX_COLOR: Record<string, string> = {
  SIGNUP_BONUS: 'text-teal-600', UPLOAD_REWARD: 'text-teal-600',
  UPLOAD_QUALITY_BONUS: 'text-teal-600', LIKE_RECEIVED: 'text-teal-600',
  VIEW_SHARE: 'text-teal-600', ADMIN_GRANT: 'text-blue-600',
  REPORT_REWARD: 'text-teal-600',
  VIEW_SPEND: 'text-red-500', DOWNLOAD_SPEND: 'text-red-500',
  BOOST_SPEND: 'text-red-500', ADMIN_DEDUCT: 'text-red-500',
  PENALTY_DEDUCT: 'text-red-500',
};

const fmt = (n: number) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(Math.round(n ?? 0));

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { stats, members, recentTxs, loading, error, refresh, isAdmin } = useAdmin();

  const [activeTab, setActiveTab]       = useState<'overview' | 'members' | 'txs' | 'supply' | 'settings'>('overview');
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedMember, setSelectedMember] = useState<MemberWithBalance | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<MemberWithBalance | null>(null);
  const [confirmingPending, setConfirmingPending] = useState(false);
  const [confirmResult, setConfirmResult] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) router.push('/');
  }, [user, authLoading, isAdmin, router]);

  const [commissionRate, setCommissionRate] = useState<number>(30);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (activeTab === 'settings') {
      getDoc(doc(db, 'settings', 'admin')).then(snap => {
        if (snap.exists() && typeof snap.data().platformCommissionRate === 'number') {
          setCommissionRate(Math.round(snap.data().platformCommissionRate * 100));
        }
      });
    }
  }, [activeTab]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'admin'), { platformCommissionRate: commissionRate / 100 }, { merge: true });
      alert('설정이 저장되었습니다.');
    } catch (e) {
      alert('설정 저장 실패');
    }
    setSavingSettings(false);
  };

  const filteredMembers = members.filter(m =>
    searchQuery === '' ||
    m.name.includes(searchQuery) ||
    m.hospital?.includes(searchQuery) ||
    m.email?.includes(searchQuery)
  );

  const handleConfirmPending = async () => {
    setConfirmingPending(true);
    try {
      const n = await confirmAllPendingTransactions();
      setConfirmResult(`${n}건 확정 완료`);
      refresh();
      setTimeout(() => setConfirmResult(''), 3000);
    } catch (e: any) { setConfirmResult(`오류: ${e.message}`); }
    finally { setConfirmingPending(false); }
  };

  const handleStatusChange = async (uid: string, status: 'approved' | 'rejected') => {
    if (!user) return;
    await updateMemberStatus(uid, status, user.uid);
    refresh();
  };

  const fmtTime = (d: Date) => new Intl.DateTimeFormat('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(d instanceof Date ? d : new Date());

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAdmin) return null;

  const TABS = [
    { id: 'overview', label: '개요' },
    { id: 'members',  label: `회원 관리 (${members.length})` },
    { id: 'txs',      label: `트랜잭션 (실시간)` },
    { id: 'supply',   label: 'RAB 공급 현황' },
    { id: 'settings', label: '플랫폼 설정' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Admin Top Bar */}
      <div className="bg-[#0d2137] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Zap size={12} className="text-amber-400" />
            <span className="text-amber-400 font-medium">Admin Console</span>
            <span>·</span>
            <span>{profile?.name} 관리자</span>
          </div>
          <div className="flex items-center gap-3">
            {confirmResult && (
              <span className="text-xs text-teal-400">{confirmResult}</span>
            )}
            <button
              onClick={handleConfirmPending}
              disabled={confirmingPending}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1 rounded-lg transition-colors"
            >
              <CheckCircle size={12} />
              {confirmingPending ? '처리 중...' : `Pending 확정 (${stats?.pendingTxCount ?? 0}건)`}
            </button>
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1 rounded-lg transition-colors"
            >
              <RefreshCw size={12} />새로고침
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-5 border border-red-100">
            <AlertTriangle size={14} />{error}
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="총 유통 RAB"     value={fmt(stats?.totalSupply ?? 0)}         sub={`평균 ${fmt(stats?.avgBalance ?? 0)} RAB/회원`}    color="#7c5cbf" />
          <StatCard label="누적 발행 RAB"   value={fmt(stats?.totalEverIssued ?? 0)}      sub={`소각 ${fmt(stats?.totalEverBurned ?? 0)} RAB`}    color="#1a9e75" />
          <StatCard label="플랫폼 누적 수익" value={fmt(stats?.totalPlatformRevenue ?? 0)} sub={`오늘 트랜잭션 ${stats?.todayTxCount ?? 0}건`}    color="#2c7be5" />
          <StatCard label="전체 회원"        value={fmt(stats?.totalMembers ?? 0)}         sub={`케이스 ${fmt(stats?.totalCases ?? 0)}개`}         color="#d4920c" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 border-b border-slate-200">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === t.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >{t.label}</button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-5">
            {/* RAB 구성 */}
            <div className="card p-5">
              <h3 className="text-sm font-medium text-slate-700 mb-4">RAB 공급 구성</h3>
              {[
                { label:'유통 중 (확정 잔액)', val: stats?.totalSupply ?? 0, color:'#7c5cbf', pct: stats ? Math.round((stats.totalSupply / Math.max(stats.totalEverIssued, 1)) * 100) : 0 },
                { label:'누적 소각 (소비)',    val: stats?.totalEverBurned ?? 0, color:'#e24b4a', pct: stats ? Math.round((stats.totalEverBurned / Math.max(stats.totalEverIssued, 1)) * 100) : 0 },
                { label:'플랫폼 수익',         val: stats?.totalPlatformRevenue ?? 0, color:'#1a9e75', pct: stats ? Math.round((stats.totalPlatformRevenue / Math.max(stats.totalEverIssued, 1)) * 100) : 0 },
              ].map(r => (
                <div key={r.label} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">{r.label}</span>
                    <span className="font-medium text-slate-700">{fmt(r.val)} RAB ({r.pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${r.pct}%`, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* 대기 현황 */}
            <div className="card p-5">
              <h3 className="text-sm font-medium text-slate-700 mb-4">대기 현황</h3>
              <div className="space-y-3">
                {[
                  { label:'Pending 트랜잭션', val: `${stats?.pendingTxCount ?? 0}건`, icon:<Clock size={14}/>, color:'text-amber-500', bg:'bg-amber-50' },
                  { label:'오늘 발생 트랜잭션', val: `${stats?.todayTxCount ?? 0}건`, icon:<TrendingUp size={14}/>, color:'text-blue-500', bg:'bg-blue-50' },
                  { label:'전체 회원', val: `${stats?.totalMembers ?? 0}명`, icon:<Users size={14}/>, color:'text-teal-600', bg:'bg-teal-50' },
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.bg} ${r.color}`}>
                      {r.icon}
                    </div>
                    <span className="text-sm text-slate-600 flex-1">{r.label}</span>
                    <span className="text-sm font-medium text-slate-800">{r.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 최근 트랜잭션 미리보기 */}
            <div className="card col-span-2 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700">최근 트랜잭션 (실시간)</h3>
                <button onClick={() => setActiveTab('txs')} className="text-xs text-teal-600 hover:underline flex items-center gap-1">
                  전체 보기 <ChevronRight size={12} />
                </button>
              </div>
              <div>
                {recentTxs.slice(0, 8).map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <div className={`text-xs font-medium w-24 shrink-0 ${TX_COLOR[tx.type] ?? 'text-slate-500'}`}>
                      {TX_LABELS[tx.type]}
                    </div>
                    <div className="text-xs text-slate-400 truncate flex-1">{tx.description}</div>
                    <div className={`text-xs font-medium w-20 text-right shrink-0 ${tx.amount > 0 ? 'text-teal-600' : 'text-red-500'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} RAB
                    </div>
                    <div className="text-[11px] text-slate-300 w-28 text-right shrink-0">
                      {fmtTime(tx.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MEMBERS ── */}
        {activeTab === 'members' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input-field pl-8"
                  placeholder="이름, 병원명, 이메일 검색"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <span className="text-xs text-slate-400">{filteredMembers.length}명</span>
            </div>

            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['이름', '병원', '지역', '잔액', '누적획득', '누적소비', '상태', ''].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(m => (
                    <tr key={m.uid} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-700 text-blue-300 text-xs font-semibold flex items-center justify-center shrink-0">
                            {m.name?.slice(0, 1)}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-800">{m.name}</p>
                            <p className="text-[10px] text-slate-400">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{m.hospital}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{m.region}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-slate-800">{fmt(m.balance)}</span>
                        <span className="text-[10px] text-amber-500 ml-1">RAB</span>
                        {m.pendingBalance > 0 && (
                          <span className="text-[10px] text-amber-400 ml-1">(+{fmt(m.pendingBalance)}↻)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-teal-600">+{fmt(m.totalEarned)}</td>
                      <td className="px-4 py-3 text-xs text-red-400">-{fmt(m.totalSpent)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                          m.status === 'approved' ? 'bg-teal-50 text-teal-700' :
                          m.status === 'rejected' ? 'bg-red-50 text-red-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {m.status === 'approved' ? '승인' : m.status === 'rejected' ? '거절' : '대기'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setAdjustTarget(m)}
                            className="text-[11px] px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors font-medium"
                          >
                            RAB 조정
                          </button>
                          {m.status !== 'approved' && (
                            <button
                              onClick={() => handleStatusChange(m.uid, 'approved')}
                              className="text-[11px] px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              승인
                            </button>
                          )}
                          {m.status === 'approved' && (
                            <button
                              onClick={() => handleStatusChange(m.uid, 'rejected')}
                              className="text-[11px] px-2.5 py-1 rounded-md bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
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
        )}

        {/* ── TRANSACTIONS ── */}
        {activeTab === 'txs' && (
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700">전체 트랜잭션 (실시간 · 최근 50건)</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-[11px] text-teal-600">Live</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['시각', '유형', '금액', '잔액후', '상태', '설명', 'UserID'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-medium text-[10px] text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentTxs.map(tx => (
                    <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{fmtTime(tx.createdAt)}</td>
                      <td className={`px-4 py-2.5 font-medium whitespace-nowrap ${TX_COLOR[tx.type] ?? 'text-slate-500'}`}>
                        {TX_LABELS[tx.type]}
                      </td>
                      <td className={`px-4 py-2.5 font-medium whitespace-nowrap ${tx.amount > 0 ? 'text-teal-600' : 'text-red-500'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount} RAB
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{tx.balanceAfter} RAB</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase ${
                          tx.status === 'confirmed' ? 'bg-teal-50 text-teal-700' :
                          tx.status === 'pending'   ? 'bg-amber-50 text-amber-600' :
                          'bg-red-50 text-red-500'
                        }`}>{tx.status}</span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 max-w-[200px] truncate">{tx.description}</td>
                      <td className="px-4 py-2.5 text-slate-300 font-mono text-[10px]">{tx.userId?.slice(0, 8)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SUPPLY ── */}
        {activeTab === 'supply' && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label:'소각률 (소비/발행)', val: stats ? `${Math.round((stats.totalEverBurned / Math.max(stats.totalEverIssued, 1)) * 100)}%` : '-', good: true, desc:'목표: 15% 이상' },
              { label:'유통 공급량',        val: fmt(stats?.totalSupply ?? 0) + ' RAB', good: true, desc:'확정 잔액 합계' },
              { label:'평균 회원 잔액',     val: fmt(stats?.avgBalance ?? 0) + ' RAB', good: (stats?.avgBalance ?? 0) > 20, desc:'권장: 25 RAB 이상' },
            ].map(r => (
              <div key={r.label} className="card p-5">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-3">{r.label}</p>
                <p className={`text-2xl font-medium mb-1 ${r.good ? 'text-teal-600' : 'text-red-500'}`}>{r.val}</p>
                <p className="text-xs text-slate-400">{r.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === 'settings' && (
          <div className="max-w-xl">
            <div className="card p-6">
              <h3 className="text-sm font-medium text-slate-800 mb-5">수수료 및 정산 설정</h3>
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-500 mb-2">
                  플랫폼 수수료율 (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="input-field w-32"
                    value={commissionRate}
                    onChange={e => setCommissionRate(Number(e.target.value))}
                  />
                  <span className="text-sm text-slate-600">%</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  데이터 열람 시 업로더에게 지급되는 정산금에서 차감될 수수료 비율입니다.
                  예: 30% 설정 시 업로더가 70% 수익을 가져갑니다. 변경 시점 이후의 결제부터 적용됩니다.
                </p>
              </div>
              <div className="border-t border-slate-100 pt-5 text-right">
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 disabled:opacity-50"
                >
                  {savingSettings ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* RAB 조정 모달 */}
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
