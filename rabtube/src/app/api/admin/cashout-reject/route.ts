export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/cashout-reject
 * 환전 거절 처리 + RAB 자동 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { cashoutId, userId, rabAmount, rejectedReason } = await req.json();

    await adminDb.runTransaction(async tx => {
      // 환전 상태 업데이트
      tx.update(adminDb.collection('rab_cashouts').doc(cashoutId), {
        status:          'rejected',
        rejectedReason,
        processedAt:     new Date(),
      });

      // RAB 잔액 반환
      const balRef  = adminDb.collection('rab_balances').doc(userId);
      const balSnap = await tx.get(balRef);
      if (!balSnap.exists) return;

      const bal = balSnap.data()!;
      tx.update(balRef, {
        balance:   (bal.balance ?? 0) + rabAmount,
        totalSpent: Math.max(0, (bal.totalSpent ?? 0) - rabAmount),
        updatedAt: new Date(),
      });

      // 반환 트랜잭션 기록
      tx.set(adminDb.collection('rab_transactions').doc(), {
        userId,
        type:          'ADMIN_GRANT',
        amount:        rabAmount,
        balanceAfter:  (bal.balance ?? 0) + rabAmount,
        status:        'confirmed',
        description:   `환전 거절 RAB 반환: ${rabAmount} RAB (사유: ${rejectedReason})`,
        createdAt:     new Date(),
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Cashout Reject]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
