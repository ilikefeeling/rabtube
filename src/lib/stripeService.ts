/**
 * Stripe 결제 서비스
 * - 구독 결제 (Pro / Clinic)
 * - RAB 직접 구매
 * - Webhook 처리
 */

import {
  doc, collection, setDoc, addDoc, updateDoc,
  getDoc, getDocs, query, where, orderBy, limit,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Subscription, PaymentRecord,
  SubscriptionTier, SubscriptionStatus,
} from '@/types';
import { SUBSCRIPTION_PLANS } from '@/types';
import { creditBalanceAdmin } from './pointService';

const COL = {
  SUBSCRIPTIONS: 'subscriptions',
  PAYMENTS:      'payments',
} as const;

/* ─────────────────────────────────────
   Stripe Checkout 세션 생성 (서버 API 호출)
───────────────────────────────────── */

export async function createCheckoutSession(
  userId:   string,
  tier:     'pro' | 'clinic',
  email:    string
): Promise<string> {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, tier, email }),
  });
  if (!res.ok) throw new Error('결제 세션 생성 실패');
  const { url } = await res.json();
  return url;
}

/* ─────────────────────────────────────
   RAB 직접 구매 ($0.01988 / RAB)
───────────────────────────────────── */

export async function createRabPurchaseSession(
  userId:    string,
  rabAmount: number,
  email:     string
): Promise<string> {
  const res = await fetch('/api/stripe/rab-purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, rabAmount, email }),
  });
  if (!res.ok) throw new Error('RAB 구매 세션 생성 실패');
  const { url } = await res.json();
  return url;
}

/* ─────────────────────────────────────
   구독 정보 조회
───────────────────────────────────── */

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const snap = await getDoc(doc(db, COL.SUBSCRIPTIONS, userId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    ...d,
    currentPeriodStart: (d.currentPeriodStart as Timestamp)?.toDate() ?? new Date(),
    currentPeriodEnd:   (d.currentPeriodEnd   as Timestamp)?.toDate() ?? new Date(),
    createdAt:          (d.createdAt          as Timestamp)?.toDate() ?? new Date(),
    updatedAt:          (d.updatedAt          as Timestamp)?.toDate() ?? new Date(),
  } as Subscription;
}

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const sub = await getSubscription(userId);
  if (!sub || sub.status !== 'active') return 'free';
  return sub.tier;
}

/* ─────────────────────────────────────
   결제 내역 조회
───────────────────────────────────── */

export async function getPaymentHistory(
  userId: string,
  count = 20
): Promise<PaymentRecord[]> {
  const q = query(
    collection(db, COL.PAYMENTS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    ...d.data(),
    id: d.id,
    createdAt: (d.data().createdAt as Timestamp)?.toDate() ?? new Date(),
  })) as PaymentRecord[];
}

/* ─────────────────────────────────────
   구독 취소
───────────────────────────────────── */

export async function cancelSubscription(userId: string): Promise<void> {
  const sub = await getSubscription(userId);
  if (!sub) throw new Error('구독 정보가 없습니다');

  const res = await fetch('/api/stripe/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stripeSubId: sub.stripeSubId }),
  });
  if (!res.ok) throw new Error('구독 취소 실패');

  await updateDoc(doc(db, COL.SUBSCRIPTIONS, userId), {
    cancelAtPeriodEnd: true,
    updatedAt: serverTimestamp(),
  });
}



/* ─────────────────────────────────────
   RAB 구독 결제 (현금 대신 RAB로 구독)
───────────────────────────────────── */

export async function paySubscriptionWithRab(
  userId: string,
  tier:   'pro' | 'clinic'
): Promise<void> {
  const plan = SUBSCRIPTION_PLANS[tier];
  const cost = plan.priceRab;

  const balSnap = await getDoc(doc(db, 'rab_balances', userId));
  if (!balSnap.exists() || (balSnap.data().balance ?? 0) < cost) {
    throw new Error(`RAB 잔액이 부족합니다. 필요: ${cost} RAB`);
  }

  // 포인트 차감 + 구독 활성화
  const res = await fetch('/api/payments/rab-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, tier, cost }),
  });
  if (!res.ok) throw new Error('RAB 구독 처리 실패');
}
