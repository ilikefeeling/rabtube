export const dynamic = 'force-dynamic';

/**
 * POST /api/stripe/webhook
 * Stripe 이벤트 수신 및 처리
 *
 * 처리 이벤트:
 * - checkout.session.completed → 구독 활성화 or RAB 지급
 * - customer.subscription.updated → 구독 상태 갱신
 * - customer.subscription.deleted → 구독 해지
 * - invoice.payment_failed → 결제 실패 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('[Webhook] signature 검증 실패:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {

      /* ── 결제 완료 ── */
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta    = session.metadata ?? {};

        if (session.mode === 'subscription') {
          // 구독 활성화
          await activateSubscription(
            meta.userId,
            meta.tier as 'pro' | 'clinic',
            session.customer as string,
            session.subscription as string
          );
        } else if (meta.type === 'rab_purchase') {
          // RAB 즉시 지급
          await grantRabFromPurchase(
            meta.userId,
            parseInt(meta.rabAmount),
            parseInt(meta.krwAmount),
            session.id
          );
        }
        break;
      }

      /* ── 구독 갱신/변경 ── */
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub);
        break;
      }

      /* ── 구독 해지 ── */
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await deactivateSubscription(sub.id);
        break;
      }

      /* ── 결제 실패 ── */
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId   = invoice.subscription as string;
        if (subId) await markSubscriptionPastDue(subId);
        break;
      }

      default:
        console.log(`[Webhook] 미처리 이벤트: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[Webhook] 처리 오류:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ── 구독 활성화 ─────────────────── */
async function activateSubscription(
  userId:           string,
  tier:             'pro' | 'clinic',
  stripeCustomerId: string,
  stripeSubId:      string
) {
  const sub = await stripe.subscriptions.retrieve(stripeSubId);

  await adminDb.collection('subscriptions').doc(userId).set({
    userId,
    tier,
    status:             'active',
    stripeCustomerId,
    stripeSubId,
    currentPeriodStart: new Date(sub.current_period_start * 1000),
    currentPeriodEnd:   new Date(sub.current_period_end   * 1000),
    cancelAtPeriodEnd:  sub.cancel_at_period_end,
    createdAt:          new Date(),
    updatedAt:          new Date(),
  });

  // 회원 tier 업데이트
  await adminDb.collection('users').doc(userId).set(
    { subscriptionTier: tier, updatedAt: new Date() }, { merge: true }
  );

  // 결제 내역 기록
  await adminDb.collection('payments').add({
    userId,
    type:           'subscription',
    status:         'succeeded',
    amountKrw:      tier === 'pro' ? 29000 : 79000,
    amountRab:      0,
    stripePaymentId: stripeSubId,
    description:    `${tier === 'pro' ? '프로' : '클리닉'} 구독 활성화`,
    createdAt:      new Date(),
  });
}

/* ── RAB 구매 지급 ───────────────── */
async function grantRabFromPurchase(
  userId:    string,
  rabAmount: number,
  krwAmount: number,
  sessionId: string
) {
  // 잔액 업데이트
  const balRef  = adminDb.collection('rab_balances').doc(userId);
  const balSnap = await balRef.get();
  const cur     = balSnap.exists ? balSnap.data()! : { balance: 0, totalEarned: 0, totalSpent: 0 };

  await balRef.set({
    userId,
    balance:        (cur.balance ?? 0) + rabAmount,
    pendingBalance: cur.pendingBalance ?? 0,
    totalEarned:    (cur.totalEarned ?? 0) + rabAmount,
    totalSpent:     cur.totalSpent ?? 0,
    updatedAt:      new Date(),
  });

  // 트랜잭션 기록
  await adminDb.collection('rab_transactions').add({
    userId,
    type:          'ADMIN_GRANT',
    amount:        rabAmount,
    balanceAfter:  (cur.balance ?? 0) + rabAmount,
    status:        'confirmed',
    description:   `RAB 구매: ₩${krwAmount.toLocaleString()} → +${rabAmount} RAB`,
    relatedCaseId: null,
    confirmedAt:   null,
    createdAt:     new Date(),
  });

  // 결제 내역
  await adminDb.collection('payments').add({
    userId,
    type:            'rab_purchase',
    status:          'succeeded',
    amountKrw:       krwAmount,
    amountRab:       rabAmount,
    stripePaymentId: sessionId,
    description:     `RAB ${rabAmount}개 구매`,
    createdAt:       new Date(),
  });
}

/* ── 구독 상태 동기화 ────────────── */
async function syncSubscription(sub: Stripe.Subscription) {
  const query = await adminDb.collection('subscriptions')
    .where('stripeSubId', '==', sub.id).limit(1).get();
  if (query.empty) return;

  const docRef = query.docs[0].ref;
  await docRef.update({
    status:             sub.status as any,
    currentPeriodStart: new Date(sub.current_period_start * 1000),
    currentPeriodEnd:   new Date(sub.current_period_end   * 1000),
    cancelAtPeriodEnd:  sub.cancel_at_period_end,
    updatedAt:          new Date(),
  });
}

/* ── 구독 해지 ───────────────────── */
async function deactivateSubscription(stripeSubId: string) {
  const query = await adminDb.collection('subscriptions')
    .where('stripeSubId', '==', stripeSubId).limit(1).get();
  if (query.empty) return;

  const docSnap = query.docs[0];
  const userId  = docSnap.data().userId;

  await docSnap.ref.update({ status: 'canceled', updatedAt: new Date() });
  await adminDb.collection('users').doc(userId).set(
    { subscriptionTier: 'free', updatedAt: new Date() }, { merge: true }
  );
}

/* ── 결제 실패 ───────────────────── */
async function markSubscriptionPastDue(stripeSubId: string) {
  const query = await adminDb.collection('subscriptions')
    .where('stripeSubId', '==', stripeSubId).limit(1).get();
  if (query.empty) return;
  await query.docs[0].ref.update({ status: 'past_due', updatedAt: new Date() });
}
