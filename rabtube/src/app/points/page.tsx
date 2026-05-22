'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, TrendingUp, TrendingDown, Clock, CreditCard, X } from 'lucide-react';
import Header from '@/components/Header';
import PurchaseModal from '@/components/PurchaseModal';
import { usePoints } from '@/hooks/usePoints';
import { useAuth } from '@/lib/AuthContext';
import { RAB_POLICY } from '@/types';
import type { PointTxType } from '@/types';

const TX_LABELS: Record<PointTxType, string> = {
  SIGNUP_BONUS:         '회원가입 보너스',
  UPLOAD_REWARD:        '케이스 업로드 보상',
  UPLOAD_QUALITY_BONUS: '품질 보너스',
  LIKE_RECEIVED:        '좋아요 수신',
  VIEW_SHARE:           '시청료 수익',
  VIEW_SPEND:           '케이스 시청',
  DOWNLOAD_SPEND:       '케이스 다운로드',
  BOOST_SPEND:          '피드 부스트',
  ADMIN_GRANT:          '관리자 지급',
  ADMIN_DEDUCT:         '관리자 차감',
  REPORT_REWARD:        '신고 기여 보상',
  PENALTY_DEDUCT:       '불량 케이스 패널티',
  RAB_PURCHASE:         'RAB 충전',
};

const EARN_TYPES: PointTxType[] = [
  'SIGNUP_BONUS', 'UPLOAD_REWARD', 'UPLOAD_QUALITY_BONUS',
  'LIKE_RECEIVED', 'VIEW_SHARE', 'ADMIN_GRANT', 'REPORT_REWARD', 'RAB_PURCHASE',
];

function PointsPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { balance, transactions, loading, refresh } = usePoints();
  const [showPurchase, setShowPurchase] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    const purchase = searchParams.get('purchase');
    if (purchase === 'success') {
      setToast({ message: 'RAB 충전 결제가 성공적으로 완료되었습니다!', type: 'success' });
      refresh();
      router.replace('/points');
    } else if (purchase === 'canceled') {
      setToast({ message: '결제가 취소되었습니다.', type: 'error' });
      router.replace('/points');
    }
  }, [searchParams, router, refresh]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const isEarn = (type: PointTxType) => EARN_TYPES.includes(type);

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat('ko-KR', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(d);

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/" className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-6 transition-colors">
          <ChevronLeft size={14} />피드로 돌아가기
        </Link>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card p-5">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">
              확정 잔액
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-medium text-slate-800">
                {(balance?.balance ?? 0).toLocaleString()}
              </span>
              <span className="text-sm font-bold text-amber-500">RAB</span>
            </div>
            <div className="mt-3">
              <button
                onClick={() => setShowPurchase(true)}
                className="w-full bg-slate-800 text-white flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                <CreditCard size={14} /> 충전하기
              </button>
            </div>
          </div>
          <div className="card p-5">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">
              대기 중 (48h)
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-medium text-slate-500">
                {(balance?.pendingBalance ?? 0).toLocaleString()}
              </span>
              <span className="text-sm font-bold text-slate-400">RAB</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">업로드 보상 검수 대기</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
            <p className="text-[11px] font-medium text-teal-600 uppercase tracking-wide mb-1">누적 획득</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-medium text-teal-700">
                +{(balance?.totalEarned ?? 0).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-teal-500">RAB</span>
            </div>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-[11px] font-medium text-red-500 uppercase tracking-wide mb-1">누적 소비</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-medium text-red-600">
                -{(balance?.totalSpent ?? 0).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-red-400">RAB</span>
            </div>
          </div>
        </div>

        {/* Policy Info */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-2">RAB 정책 안내</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {[
              ['회원가입 보너스', `+${RAB_POLICY.SIGNUP_BONUS} RAB`],
              ['케이스 업로드', `+${RAB_POLICY.UPLOAD_BASE}~${RAB_POLICY.UPLOAD_BASE + RAB_POLICY.UPLOAD_QUALITY_MAX} RAB`],
              ['좋아요 수신', `+${RAB_POLICY.LIKE_REWARD} RAB`],
              ['케이스 시청', `업로더 설정 가격에 따라 차감`],
              ['시청료 배분', `플랫폼 수수료 제외 후 업로더 지급`],
              ['업로드 보상 대기', `${RAB_POLICY.UPLOAD_PENDING_HOURS}시간`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs py-0.5">
                <span className="text-amber-700">{k}</span>
                <span className="font-medium text-amber-800">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700">거래 내역</h2>
            <span className="text-xs text-slate-400">{transactions.length}건</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-slate-400">
              <p className="text-sm">아직 거래 내역이 없습니다</p>
              <p className="text-xs mt-1">케이스를 업로드하면 RAB를 획득할 수 있습니다</p>
            </div>
          ) : (
            <div>
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    tx.status === 'pending'
                      ? 'bg-amber-50'
                      : isEarn(tx.type)
                        ? 'bg-teal-50'
                        : 'bg-red-50'
                  }`}>
                    {tx.status === 'pending'
                      ? <Clock size={14} className="text-amber-500" />
                      : isEarn(tx.type)
                        ? <TrendingUp size={14} className="text-teal-600" />
                        : <TrendingDown size={14} className="text-red-500" />
                    }
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {TX_LABELS[tx.type]}
                      </p>
                      {tx.status === 'pending' && (
                        <span className="text-[9px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase">
                          대기
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{tx.description}</p>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {formatDate(tx.createdAt instanceof Date ? tx.createdAt : new Date())}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-medium ${
                      tx.status === 'pending'
                        ? 'text-amber-500'
                        : tx.amount > 0
                          ? 'text-teal-600'
                          : 'text-red-500'
                    }`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} RAB
                    </p>
                    <p className="text-[11px] text-slate-300">
                      잔액 {tx.balanceAfter.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showPurchase && (
        <PurchaseModal
          onClose={() => setShowPurchase(false)}
          onSuccess={() => refresh()}
        />
      )}

      {/* Premium Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in bg-white shadow-2xl rounded-2xl border border-slate-100 p-4 flex items-center gap-3 max-w-sm">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            toast.type === 'success' ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {toast.type === 'success' ? (
              <TrendingUp size={16} />
            ) : (
              <X size={16} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 leading-tight truncate">{toast.message}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">실시간으로 포인트가 연동되었습니다</p>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 transition-colors ml-auto p-1 rounded-full hover:bg-slate-50">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function PointsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PointsPageContent />
    </Suspense>
  );
}
