import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const email = 'ilikefeeling@gmail.com';
    const amountRab = 1000;

    // 1. Get user by email using Admin SDK
    const userRecord = await adminAuth.getUserByEmail(email);
    const userId = userRecord.uid;

    // 2. Reference to rab_balances
    const balRef = adminDb.collection('rab_balances').doc(userId);
    const balSnap = await balRef.get();
    
    let cur = { balance: 0, pendingBalance: 0, totalEarned: 0, totalSpent: 0 };
    if (balSnap.exists) {
      const d = balSnap.data() || {};
      cur = {
        balance: d.balance ?? 0,
        pendingBalance: d.pendingBalance ?? 0,
        totalEarned: d.totalEarned ?? 0,
        totalSpent: d.totalSpent ?? 0,
      };
    }

    const newBalance = (cur.balance ?? 0) + amountRab;
    const newEarned = (cur.totalEarned ?? 0) + amountRab;

    // 3. Update PointBalance
    await balRef.set({
      userId,
      balance: newBalance,
      pendingBalance: cur.pendingBalance ?? 0,
      totalEarned: newEarned,
      totalSpent: cur.totalSpent ?? 0,
      updatedAt: new Date(),
    });

    // 4. Record Transaction
    await adminDb.collection('rab_transactions').add({
      userId,
      type: 'RAB_PURCHASE',
      amount: amountRab,
      balanceAfter: newBalance,
      status: 'confirmed',
      description: `[1회성 기능 테스트 충전] +${amountRab.toLocaleString()} RAB`,
      createdAt: new Date(),
    });

    // 5. Record Payment
    await adminDb.collection('payments').add({
      userId,
      type: 'rab_purchase',
      status: 'succeeded',
      amountKrw: 0,
      amountRab: amountRab,
      description: `[1회성 기능 테스트 충전] +${amountRab} RAB`,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully charged ${amountRab} RAB to ${email} (${userId}).`,
      newBalance,
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      error: e.message,
    }, { status: 500 });
  }
}
