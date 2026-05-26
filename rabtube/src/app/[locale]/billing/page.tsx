'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, CheckCircle, AlertCircle, CreditCard,
  Coins, ArrowDownToLine, Zap, Crown, Building2,
} from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/lib/AuthContext';
import { usePoints } from '@/hooks/usePoints';
import { recordRabPurchase } from '@/lib/pointService';
import {
  createCheckoutSession,
  createRabPurchaseSession,
  getSubscription,
  cancelSubscription,
  getCashoutHistory,
} from '@/lib/stripeService';
import { requestRabCashout } from '@/lib/stripeService';
import { SUBSCRIPTION_PLANS, RAB_EXCHANGE } from '@/types';
import type { Subscription } from '@/types';

const fmt = (n: number) => n.toLocaleString();

/* RAB 구매 패키지 */
const RAB_PACKAGES = [
  { krw: 1000,  rab: 90,   label: '입문',  bonus: '+10%' },
  { krw: 5000,  rab: 500,  label: '일반',  bonus: '+20%' },
  { krw: 10000, rab: 1100, label: '인기',  bonus: '+25%', highlight: true },
  { krw: 50000, rab: 6000, label: '대용량', bonus: '+30%' },
];

/* ── useSearchParams는 Suspense 내부 컴포넌트에서만 사용 ── */
function SearchParamsHandler({ onSuccess, onPurchase }: {
  onSuccess: () => void;
  onPurchase: (rab: string | null) => void;
}) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('success')) onSuccess();
    if (searchParams.get('purchase') === 'success') onPurchase(searchParams.get('rab'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  return null;
}

export default function BillingPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { balance, refresh: refreshPoints } = usePoints();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tab, setTab]                   = useState<'rab' | 'cashout'>('rab');
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast]               = useState('');

  // 캐시아웃 폼
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [bankName, setBankName]           = useState('');
  const [accountNo, setAccountNo]         = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [cashoutHistory, setCashoutHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getSubscription(user.uid),
      getCashoutHistory(user.uid),
    ]).then(([sub, hist]) => {
      setSubscription(sub);
      setCashoutHistory(hist);
      setLoading(false);
    });
  }, [user]);

  // URL 파라미터 토스트는 SearchParamsHandler에서 처리

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleSubscribe = async (tier: 'pro' | 'clinic') => {
    if (!user || !profile) return;
    setActionLoading(tier);
    try {
      const url = await createCheckoutSession(user.uid, tier, user.email ?? '');
      window.location.href = url;
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setActionLoading('');
    }
  };

  const handleRabPurchase = async (krw: number) => {
    if (!user) return;
    setActionLoading(String(krw));
    try {
      if (user.email === 'ilikefeeling@gmail.com') {
        const pkg = RAB_PACKAGES.find(p => p.krw === krw);
        const rab = pkg ? pkg.rab : Math.round(krw / 10);
        await recordRabPurchase(user.uid, krw, rab, 'test_recharge_' + Date.now());
        showToast(`🪙 [테스트 충전] ${rab.toLocaleString()} RAB가 즉시 지급되었습니다!`);
        refreshPoints();
      } else {
        const url = await createRabPurchaseSession(user.uid, krw, user.email ?? '');
        window.location.href = url;
      }
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setActionLoading('');
    }
  };

  const handleCancel = async () => {
    if (!user || !confirm('구독을 취소하시겠습니까? 현재 기간 만료 후 해지됩니다.')) return;
    setActionLoading('cancel');
    try {
      await cancelSubscription(user.uid);
      showToast('✅ 구독 취소 신청이 완료되었습니다');
      setSubscription(s => s ? { ...s, cancelAtPeriodEnd: true } : s);
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setActionLoading('');
    }
  };

  const handleCashout = async () => {
    if (!user) return;
    const amt = parseInt(cashoutAmount);
    if (!amt || !bankName || !accountNo || !accountHolder) {
      showToast('❌ 모든 항목을 입력해 주세요');
      return;
    }
    setActionLoading('cashout');
    try {
      const res = await fetch('/api/payments/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          rabAmount: amt,
          bankName, accountNo, accountHolder,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }
      showToast('✅ 환전 신청이 완료되었습니다. 3~5 영업일 내 입금됩니다.');
      setCashoutAmount('');
      refreshPoints();
      // 히스토리 새로고침
      getCashoutHistory(user.uid).then(setCashoutHistory);
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setActionLoading('');
    }
  };

  const currentTier = subscription?.status === 'active' ? subscription.tier : 'free';
  const cashoutAmt  = parseInt(cashoutAmount) || 0;
  const cashoutFee  = Math.floor(cashoutAmt * RAB_EXCHANGE.cashoutFeeRate);
  const cashoutKrw  = (cashoutAmt - cashoutFee) * RAB_EXCHANGE.krwPerRab;

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Suspense fallback={null}>
        <SearchParamsHandler
          onSuccess={() => { showToast('✅ 결제가 완료되었습니다!'); refreshPoints(); }}
          onPurchase={(rab) => { showToast(`🪙 ${rab} RAB가 지급되었습니다!`); refreshPoints(); }}
        />
      </Suspense>
      <Header />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link href="/" className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-6 transition-colors">
          <ChevronLeft size={14} />피드로 돌아가기
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-medium text-slate-800">충전 & 환전</h1>
            <p className="text-xs text-slate-400 mt-0.5">Rab 충전 · 현금 환전</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-right">
            <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">내 RAB 잔액</p>
            <p className="text-xl font-medium text-amber-700">{fmt(balance?.balance ?? 0)} <span className="text-xs font-bold">RAB</span></p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {[
            { id: 'rab',          label: 'Rab 충전',  icon: <Coins size={14} /> },
            { id: 'cashout',      label: 'RAB 환전',  icon: <ArrowDownToLine size={14} /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── RAB PURCHASE ── */}
        {tab === 'rab' && (
          <div>
            <p className="text-sm text-slate-500 mb-5">Rab을 충전하여 케이스 시청, 다운로드, 홍보 부스트에 사용하세요.</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {RAB_PACKAGES.map(pkg => (
                <div
                  key={pkg.krw}
                  className={`card p-5 cursor-pointer transition-all ${
                    pkg.highlight
                      ? 'border-teal-200 bg-teal-50/30'
                      : 'hover:border-slate-200'
                  }`}
                >
                  {pkg.highlight && (
                    <span className="inline-block text-[9px] font-bold bg-teal-500 text-white px-2 py-0.5 rounded uppercase tracking-wide mb-3">
                      인기
                    </span>
                  )}
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xl font-medium text-slate-800">₩{fmt(pkg.krw)}</span>
                    <span className="text-xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded">
                      {pkg.bonus}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-medium text-amber-600">{fmt(pkg.rab)}</span>
                    <span className="text-sm font-bold text-amber-500">RAB</span>
                  </div>
                  <button
                    onClick={() => handleRabPurchase(pkg.krw)}
                    disabled={!!actionLoading}
                    className="w-full py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading === String(pkg.krw) ? '처리 중...' : '충전하기'}
                  </button>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-1">
              <p>• 결제는 Stripe를 통해 안전하게 처리됩니다</p>
              <p>• 충전 즉시 Rab가 계정에 지급됩니다</p>
              <p>• 충전한 Rab는 환불되지 않습니다</p>
            </div>
          </div>
        )}

        {/* ── RAB CASHOUT ── */}
        {tab === 'cashout' && (
          <div className="space-y-5">
            {/* Phase 2 notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Phase 2 기능 — 현재 베타 운영 중</p>
                <p className="text-xs text-amber-600 mt-0.5">RAB 환전은 최소 {fmt(RAB_EXCHANGE.minCashoutRab)} RAB부터 가능합니다. 수수료 {RAB_EXCHANGE.cashoutFeeRate * 100}% 적용 후 영업일 기준 3~5일 내 입금됩니다.</p>
              </div>
            </div>

            {/* Exchange info */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '환전 비율', val: `1 RAB = ₩${RAB_EXCHANGE.krwPerRab}` },
                { label: '최소 환전', val: `${fmt(RAB_EXCHANGE.minCashoutRab)} RAB` },
                { label: '수수료',   val: `${RAB_EXCHANGE.cashoutFeeRate * 100}%` },
              ].map(r => (
                <div key={r.label} className="card p-4 text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">{r.label}</p>
                  <p className="text-sm font-medium text-slate-700">{r.val}</p>
                </div>
              ))}
            </div>

            {/* Cashout form */}
            <div className="card p-5">
              <h3 className="text-sm font-medium text-slate-700 mb-4">환전 신청</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-1.5">환전할 RAB 수량</label>
                  <input
                    className="input-field"
                    type="number"
                    placeholder={`최소 ${fmt(RAB_EXCHANGE.minCashoutRab)} RAB`}
                    value={cashoutAmount}
                    onChange={e => setCashoutAmount(e.target.value)}
                  />
                  {cashoutAmt >= RAB_EXCHANGE.minCashoutRab && (
                    <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 space-y-0.5">
                      <div className="flex justify-between">
                        <span>신청 RAB</span><span>{fmt(cashoutAmt)} RAB</span>
                      </div>
                      <div className="flex justify-between text-red-400">
                        <span>수수료 ({RAB_EXCHANGE.cashoutFeeRate * 100}%)</span>
                        <span>-{fmt(cashoutFee)} RAB</span>
                      </div>
                      <div className="flex justify-between font-medium text-teal-600 pt-1 border-t border-slate-100">
                        <span>입금 예정</span>
                        <span>₩{fmt(cashoutKrw)}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-1.5">은행명</label>
                    <input className="input-field" placeholder="예) 국민은행" value={bankName} onChange={e => setBankName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-1.5">계좌번호</label>
                    <input className="input-field" placeholder="- 없이 입력" value={accountNo} onChange={e => setAccountNo(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-1.5">예금주</label>
                  <input className="input-field" placeholder="예금주 이름" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} />
                </div>
                <button
                  onClick={handleCashout}
                  disabled={!!actionLoading || cashoutAmt < RAB_EXCHANGE.minCashoutRab}
                  className="btn-primary w-full"
                >
                  {actionLoading === 'cashout' ? '처리 중...' : `₩${fmt(cashoutKrw)} 환전 신청`}
                </button>
              </div>
            </div>

            {/* Cashout history */}
            {cashoutHistory.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-50">
                  <h3 className="text-sm font-medium text-slate-700">환전 내역</h3>
                </div>
                {cashoutHistory.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      r.status === 'completed' ? 'bg-teal-500' :
                      r.status === 'rejected'  ? 'bg-red-400' :
                      'bg-amber-400'
                    }`} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-700">{fmt(r.rabAmount)} RAB → ₩{fmt(r.krwAmount)}</p>
                      <p className="text-[10px] text-slate-400">{r.bankName} {r.accountNo?.slice(-4).padStart(r.accountNo.length, '*')}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                      r.status === 'completed' ? 'bg-teal-50 text-teal-700' :
                      r.status === 'rejected'  ? 'bg-red-50 text-red-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {r.status === 'completed' ? '완료' : r.status === 'rejected' ? '거절' : '처리 중'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
