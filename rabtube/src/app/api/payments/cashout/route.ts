export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/cashout
 * RAB → 현금 환전 신청 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { RAB_EXCHANGE } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { userId, rabAmount, bankName, accountNo, accountHolder } = await req.json();

    if (!userId || !rabAmount || !bankName || !accountNo || !accountHolder) {
      return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
    }

    if (rabAmount < RAB_EXCHANGE.minCashoutRab) {
      return NextResponse.json(
        { error: `최소 환전: ${RAB_EXCHANGE.minCashoutRab} RAB` },
        { status: 400 }
      );
    }

    // 잔액 확인 + 차감 (트랜잭션)
    const balRef = adminDb.collection('rab_balances').doc(userId);

    await adminDb.runTransaction(async tx => {
      const balSnap = await tx.get(balRef);
      if (!balSnap.exists) throw new Error('잔액 정보 없음');

      const balance = balSnap.data()!.balance ?? 0;
      if (balance < rabAmount) throw new Error(`잔액 부족 (현재: ${balance} RAB)`);

      const fee      = Math.floor(rabAmount * RAB_EXCHANGE.cashoutFeeRate);
      const netRab   = rabAmount - fee;
      const krwAmount = netRab * RAB_EXCHANGE.krwPerRab;

      // 잔액 차감
      tx.update(balRef, {
        balance:   balance - rabAmount,
        totalSpent: (balSnap.data()!.totalSpent ?? 0) + rabAmount,
        updatedAt: new Date(),
      });

      // 트랜잭션 기록
      tx.set(adminDb.collection('rab_transactions').doc(), {
        userId,
        type:          'ADMIN_DEDUCT',
        amount:        -rabAmount,
        balanceAfter:  balance - rabAmount,
        status:        'confirmed',
        description:   `RAB 현금 환전 신청: ${rabAmount} RAB → ₩${krwAmount.toLocaleString()}`,
        createdAt:     new Date(),
      });

      // 환전 신청 기록
      tx.set(adminDb.collection('rab_cashouts').doc(), {
        userId,
        rabAmount,
        fee,
        netRab,
        krwAmount,
        bankName,
        accountNo,
        accountHolder,
        status:    'pending',
        createdAt: new Date(),
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Cashout]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
