'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ChevronLeft, CheckCircle, AlertCircle, CreditCard,
  Coins, Zap, Crown, Building2, ShoppingBag,
} from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/lib/AuthContext';
import { usePoints } from '@/hooks/usePoints';
import {
  createCheckoutSession,
  createRabPurchaseSession,
  getSubscription,
  cancelSubscription,
} from '@/lib/stripeService';
import { SUBSCRIPTION_PLANS } from '@/types';
import type { Subscription } from '@/types';

const fmt = (n: number) => n.toLocaleString();

/* RAB 구매 패키지 */
const RAB_PACKAGES = [
  { rab: 1000,  key: 'pkg_basic', highlight: false },
  { rab: 3000,  key: 'pkg_standard', highlight: false },
  { rab: 5000,  key: 'pkg_popular', highlight: true },
  { rab: 10000, key: 'pkg_bulk', highlight: false },
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
  const t = useTranslations('Billing');
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { balance, refresh: refreshPoints } = usePoints();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast]               = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    getSubscription(user.uid).then((sub) => {
      setSubscription(sub);
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

  const handleRabPurchase = async (rab: number) => {
    if (!user) return;
    setActionLoading(String(rab));
    try {
      if (user.email === 'ilikefeeling@gmail.com') {
        const { recordRabPurchase } = await import('@/lib/pointService');
        const usdAmount = rab * 0.01988;
        await recordRabPurchase(user.uid, usdAmount, rab, 'test_recharge_' + Date.now());
        showToast(t('toast_test_rab', { rab: rab.toLocaleString() }));
        refreshPoints();
      } else {
        const url = await createRabPurchaseSession(user.uid, rab, user.email ?? '');
        window.location.href = url;
      }
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setActionLoading('');
    }
  };

  const handleCancel = async () => {
    if (!user || !confirm(t('confirm_cancel_sub'))) return;
    setActionLoading('cancel');
    try {
      await cancelSubscription(user.uid);
      showToast(t('toast_cancel_sub'));
      setSubscription(s => s ? { ...s, cancelAtPeriodEnd: true } : s);
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setActionLoading('');
    }
  };



  const currentTier = subscription?.status === 'active' ? subscription.tier : 'free';

  if (authLoading || loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Suspense fallback={null}>
        <SearchParamsHandler
          onSuccess={() => { showToast(t('toast_payment_success')); refreshPoints(); }}
          onPurchase={(rab) => { showToast(t('toast_payment_paid', { rab: rab ?? '' })); refreshPoints(); }}
        />
      </Suspense>
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link href="/" className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-6 transition-colors">
          <ChevronLeft size={14} />{t('back_to_feed')}
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-medium text-slate-800">{t('title')}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{t('subtitle')}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-right">
            <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">{t('my_rab')}</p>
            <p className="text-xl font-medium text-amber-700">{fmt(balance?.balance ?? 0)} <span className="text-xs font-bold">RAB</span></p>
          </div>
        </div>

        {/* Marketplace CTA */}
        <Link
          href="/marketplace"
          className="flex items-center gap-3 p-4 mb-6 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-xl hover:from-teal-100 hover:to-emerald-100 transition-all group"
        >
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ShoppingBag size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-teal-800">{t('market_title')}</p>
            <p className="text-xs text-teal-600 mt-0.5">{t('market_desc')}</p>
          </div>
          <ChevronLeft size={16} className="text-teal-400 rotate-180" />
        </Link>



        {/* ── RAB PURCHASE ── */}
        <div>
          <div>
            <p className="text-sm text-slate-500 mb-5">{t('recharge_desc')}</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {RAB_PACKAGES.map(pkg => (
                <div
                  key={pkg.rab}
                  className={`card p-5 cursor-pointer transition-all ${
                    pkg.highlight
                      ? 'border-teal-200 bg-teal-50/30'
                      : 'hover:border-slate-200'
                  }`}
                >
                  {pkg.highlight && (
                    <span className="inline-block text-[9px] font-bold bg-teal-500 text-white px-2 py-0.5 rounded uppercase tracking-wide mb-3">
                      {t('pkg_popular')}
                    </span>
                  )}
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-lg font-bold text-slate-800">${(pkg.rab * 0.01988).toFixed(2)} <span className="text-[9px] text-slate-400 font-medium">USD</span></span>
                    <span className="text-xs text-teal-600 font-semibold bg-teal-50 px-2 py-0.5 rounded">
                      {t(pkg.key)}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-0.5 mb-4">
                    <span className="text-2xl font-extrabold text-amber-600">{fmt(pkg.rab)}</span>
                    <span className="text-sm font-bold text-amber-500">RAB</span>
                  </div>
                  <button
                    onClick={() => handleRabPurchase(pkg.rab)}
                    disabled={!!actionLoading}
                    className="w-full py-2 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading === String(pkg.rab) ? t('btn_charging') : t('btn_charge')}
                  </button>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-1">
              <p>{t('notice_1')}</p>
              <p>{t('notice_2')}</p>
              <p>{t('notice_3')}</p>
            </div>
          </div>
        </div>


      </main>
    </div>
  );
}
