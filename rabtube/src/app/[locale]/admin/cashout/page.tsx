'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, XCircle, Clock, RefreshCw,
  ArrowDownToLine, ChevronRight,
} from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/lib/AuthContext';
import {
  collection, query, orderBy, limit,
  getDocs, doc, updateDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CashoutRequest {
  id:             string;
  userId:         string;
  rabAmount:      number;
  fee:            number;
  netRab:         number;
  krwAmount:      number;
  bankName:       string;
  accountNo:      string;
  accountHolder:  string;
  status:         'pending' | 'processing' | 'completed' | 'rejected';
  rejectedReason?: string;
  createdAt:      Date;
  processedAt?:   Date;
}

const STATUS_STYLE = {
  pending:    { bg: 'bg-amber-50',  text: 'text-amber-700',  label: '대기 중' },
  processing: { bg: 'bg-blue-50',   text: 'text-blue-700',   label: '처리 중' },
  completed:  { bg: 'bg-teal-50',   text: 'text-teal-700',   label: '완료' },
  rejected:   { bg: 'bg-red-50',    text: 'text-red-600',    label: '거절' },
};

const fmt = (n: number) => n.toLocaleString();

export default function AdminCashoutPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [requests, setRequests]             = useState<CashoutRequest[]>([]);
  const [loading,  setLoading]              = useState(true);
  const [selected, setSelected]             = useState<CashoutRequest | null>(null);
  const [rejectReason, setRejectReason]     = useState('');
  const [processing, setProcessing]         = useState('');
  const [filterStatus, setFilterStatus]     = useState<string>('pending');
  const [toast, setToast]                   = useState('');

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'admin')) router.push('/');
  }, [user, authLoading, profile, router]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const q = filterStatus === 'all'
      ? query(collection(db, 'rab_cashouts'), orderBy('createdAt', 'desc'), limit(100))
      : query(
          collection(db, 'rab_cashouts'),
          // where('status', '==', filterStatus), // 인덱스 필요 시 활성화
          orderBy('createdAt', 'desc'),
          limit(100)
        );

    const snap = await getDocs(q);
    const all = snap.docs.map(d => ({
      ...d.data(),
      id: d.id,
      createdAt:   (d.data().createdAt  as Timestamp)?.toDate() ?? new Date(),
      processedAt: d.data().processedAt
        ? (d.data().processedAt as Timestamp).toDate()
        : undefined,
    })) as CashoutRequest[];

    setRequests(filterStatus === 'all' ? all : all.filter(r => r.status === filterStatus));
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    if (profile?.role === 'admin') fetchRequests();
  }, [profile, fetchRequests]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleApprove = async (req: CashoutRequest) => {
    if (!confirm(`${req.accountHolder}님께 ₩${fmt(req.krwAmount)} 입금 처리하시겠습니까?`)) return;
    setProcessing(req.id);
    try {
      await updateDoc(doc(db, 'rab_cashouts', req.id), {
        status:      'completed',
        processedAt: serverTimestamp(),
      });
      showToast(`✅ ${req.accountHolder}님 환전 완료 처리`);
      fetchRequests();
      setSelected(null);
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setProcessing('');
    }
  };

  const handleReject = async (req: CashoutRequest) => {
    if (!rejectReason.trim()) { showToast('❌ 거절 사유를 입력해 주세요'); return; }

    setProcessing(req.id);
    try {
      // 거절 시 RAB 반환
      await fetch('/api/admin/cashout-reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashoutId:     req.id,
          userId:        req.userId,
          rabAmount:     req.rabAmount,
          rejectedReason: rejectReason,
        }),
      });
      showToast('✅ 환전 거절 처리 완료 (RAB 반환됨)');
      fetchRequests();
      setSelected(null);
      setRejectReason('');
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setProcessing('');
    }
  };

  const pending   = requests.filter(r => r.status === 'pending').length;
  const totalKrw  = requests.filter(r => r.status === 'pending').reduce((s, r) => s + r.krwAmount, 0);

  if (authLoading || profile?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-medium text-slate-800">RAB 환전 처리</h1>
            <p className="text-xs text-slate-400 mt-0.5">관리자 전용 — 환전 신청 승인/거절</p>
          </div>
          <button onClick={fetchRequests} className="btn-secondary flex items-center gap-1.5 text-xs">
            <RefreshCw size={12} />새로고침
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: '대기 중 신청',    val: `${pending}건`,        color: 'text-amber-600' },
            { label: '대기 중 총액',    val: `₩${fmt(totalKrw)}`,  color: 'text-red-500'  },
            { label: '전체 처리 건수',  val: `${requests.length}건`, color: 'text-slate-700' },
          ].map(c => (
            <div key={c.label} className="card p-4">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">{c.label}</p>
              <p className={`text-xl font-medium ${c.color}`}>{c.val}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {['pending', 'processing', 'completed', 'rejected', 'all'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filterStatus === s
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {s === 'all' ? '전체' :
               s === 'pending' ? '대기 중' :
               s === 'processing' ? '처리 중' :
               s === 'completed' ? '완료' : '거절'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-5">
          {/* List */}
          <div className="col-span-3 card overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-slate-400">
                <ArrowDownToLine size={28} className="mb-2 opacity-40" />
                <p className="text-sm">신청 내역이 없습니다</p>
              </div>
            ) : (
              requests.map(req => {
                const st = STATUS_STYLE[req.status];
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelected(req)}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors ${
                      selected?.id === req.id ? 'bg-teal-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                      req.status === 'pending'    ? 'bg-amber-50 text-amber-600' :
                      req.status === 'completed'  ? 'bg-teal-50 text-teal-600'  :
                      req.status === 'rejected'   ? 'bg-red-50 text-red-500'    :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {req.status === 'pending'   ? <Clock size={14} /> :
                       req.status === 'completed' ? <CheckCircle size={14} /> :
                       req.status === 'rejected'  ? <XCircle size={14} />    :
                       <RefreshCw size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{req.accountHolder}</p>
                      <p className="text-xs text-slate-400 truncate">{req.bankName} {req.accountNo}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-slate-800">₩{fmt(req.krwAmount)}</p>
                      <p className="text-[10px] text-slate-400">{fmt(req.rabAmount)} RAB</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 shrink-0" />
                  </div>
                );
              })
            )}
          </div>

          {/* Detail panel */}
          <div className="col-span-2">
            {selected ? (
              <div className="card p-5 sticky top-20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-700">환전 상세</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${STATUS_STYLE[selected.status].bg} ${STATUS_STYLE[selected.status].text}`}>
                    {STATUS_STYLE[selected.status].label}
                  </span>
                </div>

                <div className="space-y-3 mb-5">
                  {[
                    { label: '예금주',    val: selected.accountHolder },
                    { label: '은행',      val: selected.bankName },
                    { label: '계좌번호',  val: selected.accountNo },
                    { label: '신청 RAB',  val: `${fmt(selected.rabAmount)} RAB` },
                    { label: '수수료',    val: `${fmt(selected.fee)} RAB (5%)` },
                    { label: '입금 금액', val: `₩${fmt(selected.krwAmount)}`, highlight: true },
                    { label: '신청 일시', val: selected.createdAt.toLocaleString('ko-KR') },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between text-xs">
                      <span className="text-slate-400">{r.label}</span>
                      <span className={`font-medium ${r.highlight ? 'text-teal-600' : 'text-slate-700'}`}>
                        {r.val}
                      </span>
                    </div>
                  ))}
                </div>

                {selected.status === 'pending' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleApprove(selected)}
                      disabled={!!processing}
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={14} />
                      {processing === selected.id ? '처리 중...' : `₩${fmt(selected.krwAmount)} 입금 완료 처리`}
                    </button>

                    <div>
                      <input
                        className="input-field mb-2 text-xs"
                        placeholder="거절 사유 입력"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                      />
                      <button
                        onClick={() => handleReject(selected)}
                        disabled={!!processing || !rejectReason.trim()}
                        className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg border border-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <XCircle size={14} />거절 (RAB 반환)
                      </button>
                    </div>
                  </div>
                )}

                {selected.status === 'completed' && selected.processedAt && (
                  <div className="bg-teal-50 rounded-lg p-3 text-xs text-teal-700">
                    ✅ {selected.processedAt.toLocaleString('ko-KR')} 처리 완료
                  </div>
                )}
                {selected.status === 'rejected' && selected.rejectedReason && (
                  <div className="bg-red-50 rounded-lg p-3 text-xs text-red-600">
                    ❌ 거절 사유: {selected.rejectedReason}
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-8 text-center text-slate-400">
                <ArrowDownToLine size={24} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">신청 건을 선택하세요</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
