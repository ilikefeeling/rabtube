'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ChevronLeft, TrendingUp, TrendingDown, Clock, CreditCard, X } from 'lucide-react';
import Header from '@/components/Header';
import PurchaseModal from '@/components/PurchaseModal';
import { usePoints } from '@/hooks/usePoints';
import { useAuth } from '@/lib/AuthContext';
import { RAB_POLICY } from '@/types';
import type { PointTxType } from '@/types';


const EARN_TYPES: PointTxType[] = [
  'SIGNUP_BONUS', 'UPLOAD_REWARD', 'UPLOAD_QUALITY_BONUS',
  'LIKE_RECEIVED', 'VIEW_SHARE', 'ADMIN_GRANT', 'REPORT_REWARD', 'RAB_PURCHASE',
];

function PointsPageContent() {
  const t = useTranslations('Points');
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
      setToast({ message: t('toast_success'), type: 'success' });
      refresh();
      router.replace('/points');
    } else if (purchase === 'canceled') {
      setToast({ message: t('toast_cancel'), type: 'error' });
      router.replace('/points');
    }
  }, [searchParams, router, refresh, t]);

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
          <ChevronLeft size={14} />{t('back_to_feed')}
        </Link>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card p-5">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">
              {t('confirmed_balance')}
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
                <CreditCard size={14} /> {t('btn_charge')}
              </button>
            </div>
          </div>
          <div className="card p-5">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">
              {t('pending_balance')}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-medium text-slate-500">
                {(balance?.pendingBalance ?? 0).toLocaleString()}
              </span>
              <span className="text-sm font-bold text-slate-400">RAB</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{t('pending_desc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
            <p className="text-[11px] font-medium text-teal-600 uppercase tracking-wide mb-1">{t('total_earned')}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-medium text-teal-700">
                +{(balance?.totalEarned ?? 0).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-teal-500">RAB</span>
            </div>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-[11px] font-medium text-red-500 uppercase tracking-wide mb-1">{t('total_spent')}</p>
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
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-2">{t('policy_title')}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {[
              [t('pol_signup'), `+${RAB_POLICY.SIGNUP_BONUS} RAB`],
              [t('pol_upload'), `+${RAB_POLICY.UPLOAD_BASE}~${RAB_POLICY.UPLOAD_BASE + RAB_POLICY.UPLOAD_QUALITY_MAX} RAB`],
              [t('pol_like'), `+${RAB_POLICY.LIKE_REWARD} RAB`],
              [t('pol_view'), t('pol_view_desc')],
              [t('pol_share'), t('pol_share_desc')],
              [t('pol_pending'), t('pol_pending_desc', { hours: RAB_POLICY.UPLOAD_PENDING_HOURS })],
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
            <h2 className="text-sm font-medium text-slate-700">{t('history_title')}</h2>
            <span className="text-xs text-slate-400">{t('history_count', { count: transactions.length })}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-slate-400">
              <p className="text-sm">아직 {t('history_title')}이 없습니다</p>
              <p className="text-xs mt-1">{t('empty_desc')}</p>
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
                        {t(`tx_${tx.type}` as any)}
                      </p>
                      {tx.status === 'pending' && (
                        <span className="text-[9px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase">
                          {t('status_pending')}
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
                      {t('balance_after', { amount: tx.balanceAfter.toLocaleString() })}
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
            <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">{t('toast_sync')}</p>
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
