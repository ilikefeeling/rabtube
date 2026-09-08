/**
 * RAB 보상 지급 모듈 (Cloud Functions 버전)
 * 클라이언트 pointService.ts와 동일한 로직을 서버에서 실행
 * 서버 측 실행으로 보안/신뢰성 보장
 */

import * as admin from 'firebase-admin';

const db  = admin.firestore();
const COL = { BALANCES: 'rab_balances', TRANSACTIONS: 'rab_transactions' } as const;

const POLICY = {
  UPLOAD_BASE:        10,
  UPLOAD_QUALITY_MAX: 20,
  PENDING_HOURS:      48,
  MONTHLY_CAP:        10,
  NEW_USER_MONTHS:    3,
  NEW_USER_RATE:      0.5,
} as const;

/* ─────────────────────────────────────
   업로드 보상 지급 (48h pending)
───────────────────────────────────── */

export async function issueUploadReward(
  userId: string,
  caseId: string,
  userCreatedAt: admin.firestore.Timestamp
): Promise<{ issued: boolean; amount: number; reason?: string }> {

  // 1. 월 상한 확인
  const startOfMonth = new Date();
  startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

  const monthlySnap = await db.collection(COL.TRANSACTIONS)
    .where('userId',    '==', userId)
    .where('type',      '==', 'UPLOAD_REWARD')
    .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startOfMonth))
    .get();

  if (monthlySnap.size >= POLICY.MONTHLY_CAP) {
    return { issued: false, reason: `월 보상 상한(${POLICY.MONTHLY_CAP}건) 초과`, amount: 0 };
  }

  // 2. 신규 회원 여부
  const createdDate = userCreatedAt.toDate();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - POLICY.NEW_USER_MONTHS);
  const isNewUser = createdDate > threeMonthsAgo;

  const amount = isNewUser
    ? Math.floor(POLICY.UPLOAD_BASE * POLICY.NEW_USER_RATE)
    : POLICY.UPLOAD_BASE;

  // 3. pending 트랜잭션 생성
  const confirmedAt = new Date(Date.now() + POLICY.PENDING_HOURS * 3600 * 1000);

  await db.runTransaction(async tx => {
    const balRef  = db.collection(COL.BALANCES).doc(userId);
    const balSnap = await tx.get(balRef);

    const cur = balSnap.exists
      ? balSnap.data()!
      : { balance: 0, pendingBalance: 0, totalEarned: 0, totalSpent: 0 };

    tx.set(balRef, {
      userId,
      balance:        cur.balance,
      pendingBalance: (cur.pendingBalance ?? 0) + amount,
      totalEarned:    cur.totalEarned,
      totalSpent:     cur.totalSpent,
      updatedAt:      admin.firestore.FieldValue.serverTimestamp(),
    });

    tx.set(db.collection(COL.TRANSACTIONS).doc(), {
      userId,
      type:          'UPLOAD_REWARD',
      amount,
      balanceAfter:  cur.balance,
      status:        'pending',
      description:   `케이스 업로드 보상 (48시간 후 확정) +${amount} RAB`,
      relatedCaseId: caseId,
      confirmedAt:   admin.firestore.Timestamp.fromDate(confirmedAt),
      createdAt:     admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { issued: true, amount };
}

/* ─────────────────────────────────────
   품질 보너스 지급 (확정)
───────────────────────────────────── */

export async function issueQualityBonus(
  userId: string,
  caseId: string,
  qualityScore: number
): Promise<void> {
  const bonus = Math.floor((qualityScore / 100) * POLICY.UPLOAD_QUALITY_MAX);
  if (bonus <= 0) return;

  await creditBalance(userId, bonus, 'UPLOAD_QUALITY_BONUS',
    `케이스 품질 보너스 (점수: ${qualityScore}) +${bonus} RAB`, caseId);
}

/* ─────────────────────────────────────
   패널티 차감 (불량 케이스)
───────────────────────────────────── */

export async function applyPenalty(
  userId: string,
  caseId: string,
  reason: string
): Promise<void> {
  await debitBalance(userId, POLICY.UPLOAD_BASE, 'PENALTY_DEDUCT',
    `불량 케이스 패널티: ${reason}`, caseId);

  // pending 보상 취소
  const pendingSnap = await db.collection(COL.TRANSACTIONS)
    .where('userId',        '==', userId)
    .where('relatedCaseId', '==', caseId)
    .where('status',        '==', 'pending')
    .get();

  const batch = db.batch();
  pendingSnap.docs.forEach(d => {
    batch.update(d.ref, { status: 'cancelled' });
  });
  if (!pendingSnap.empty) await batch.commit();
}

/* ─────────────────────────────────────
   Pending → Confirmed 배치 확정
   (Cloud Scheduler: 매 시간 실행)
───────────────────────────────────── */

export async function confirmDuePending(): Promise<number> {
  const now = admin.firestore.Timestamp.now();
  const snap = await db.collection(COL.TRANSACTIONS)
    .where('status',      '==', 'pending')
    .where('confirmedAt', '<=', now)
    .limit(200)
    .get();

  let confirmed = 0;
  for (const docSnap of snap.docs) {
    const tx = docSnap.data();
    try {
      await db.runTransaction(async t => {
        const balRef  = db.collection(COL.BALANCES).doc(tx.userId);
        const balSnap = await t.get(balRef);
        if (!balSnap.exists) return;
        const bal = balSnap.data()!;
        t.update(balRef, {
          balance:        (bal.balance ?? 0) + tx.amount,
          pendingBalance: Math.max(0, (bal.pendingBalance ?? 0) - tx.amount),
          totalEarned:    (bal.totalEarned ?? 0) + tx.amount,
          updatedAt:      admin.firestore.FieldValue.serverTimestamp(),
        });
        t.update(docSnap.ref, { status: 'confirmed' });
      });
      confirmed++;
    } catch (e) { console.error('confirm pending error:', e); }
  }
  return confirmed;
}

/* ── 내부 헬퍼 ── */

async function creditBalance(
  userId: string, amount: number,
  type: string, description: string, caseId?: string
) {
  await db.runTransaction(async tx => {
    const balRef  = db.collection(COL.BALANCES).doc(userId);
    const balSnap = await tx.get(balRef);
    const cur = balSnap.exists ? balSnap.data()!
      : { balance: 0, pendingBalance: 0, totalEarned: 0, totalSpent: 0 };
    const newBal = (cur.balance ?? 0) + amount;
    tx.set(balRef, { userId, balance: newBal, pendingBalance: cur.pendingBalance ?? 0,
      totalEarned: (cur.totalEarned ?? 0) + amount, totalSpent: cur.totalSpent ?? 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    tx.set(db.collection(COL.TRANSACTIONS).doc(), {
      userId, type, amount, balanceAfter: newBal, status: 'confirmed',
      description, relatedCaseId: caseId ?? null,
      confirmedAt: null, createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

async function debitBalance(
  userId: string, amount: number,
  type: string, description: string, caseId?: string
) {
  await db.runTransaction(async tx => {
    const balRef  = db.collection(COL.BALANCES).doc(userId);
    const balSnap = await tx.get(balRef);
    if (!balSnap.exists) return;
    const cur = balSnap.data()!;
    const newBal = Math.max(0, (cur.balance ?? 0) - amount);
    tx.update(balRef, { balance: newBal, totalSpent: (cur.totalSpent ?? 0) + amount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    tx.set(db.collection(COL.TRANSACTIONS).doc(), {
      userId, type, amount: -amount, balanceAfter: newBal, status: 'confirmed',
      description, relatedCaseId: caseId ?? null,
      confirmedAt: null, createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}
