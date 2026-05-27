export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/rab-subscription
 * RAB 토큰으로 구독 결제 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { runTransaction, doc, collection, serverTimestamp } from 'firebase/firestore';
import { SUBSCRIPTION_PLANS } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { userId, tier, cost } = await req.json();

    if (!userId || !tier || !cost) {
      return NextResponse.json({ error: '파라미터 누락' }, { status: 400 });
    }

    const plan = SUBSCRIPTION_PLANS[tier as 'pro' | 'clinic'];
    if (!plan) return NextResponse.json({ error: '잘못된 요금제' }, { status: 400 });

    await runTransaction(db, async tx => {
      const balRef  = doc(db, 'rab_balances', userId);
      const balSnap = await tx.get(balRef);
      if (!balSnap.exists()) throw new Error('잔액 정보 없음');

      const balance = balSnap.data()!.balance ?? 0;
      if (balance < cost) throw new Error(`RAB 잔액 부족 (현재: ${balance}, 필요: ${cost})`);

      const now     = new Date();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      // 잔액 차감
      tx.update(balRef, {
        balance:   balance - cost,
        totalSpent: (balSnap.data()!.totalSpent ?? 0) + cost,
        updatedAt: serverTimestamp(),
      });

      // 트랜잭션 기록
      const newTxRef = doc(collection(db, 'rab_transactions'));
      tx.set(newTxRef, {
        userId,
        type:          'BOOST_SPEND',
        amount:        -cost,
        balanceAfter:  balance - cost,
        status:        'confirmed',
        description:   `RAB 구독 결제: ${plan.name} (${cost} RAB/월)`,
        createdAt:     serverTimestamp(),
      });

      // 구독 활성화 (RAB 결제)
      const subRef = doc(db, 'subscriptions', userId);
      tx.set(subRef, {
        userId,
        tier,
        status:              'active',
        stripeCustomerId:    '',
        stripeSubId:         `rab_${userId}_${Date.now()}`,
        paymentMethod:       'rab',
        currentPeriodStart:  now,
        currentPeriodEnd:    endDate,
        cancelAtPeriodEnd:   false,
        createdAt:           serverTimestamp(),
        updatedAt:           serverTimestamp(),
      });

      // 결제 내역
      const payRef = doc(collection(db, 'payments'));
      tx.set(payRef, {
        userId,
        type:        'subscription',
        status:      'succeeded',
        amountKrw:   0,
        amountRab:   cost,
        description: `RAB 구독: ${plan.name} ${cost} RAB/월`,
        createdAt:   serverTimestamp(),
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[RAB Subscription]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
