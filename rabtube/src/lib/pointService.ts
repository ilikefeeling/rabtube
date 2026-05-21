/**
 * RAB Point Service
 * Phase 1: DB 포인트 시스템 (블록체인 전 단계)
 *
 * 핵심 원칙:
 * - 모든 잔액 변경은 Firestore 트랜잭션으로 원자적 처리
 * - 업로드 보상은 48시간 pending → confirmed
 * - 월 업로드 보상 상한(10건) 초과 시 보상 미지급
 * - 신규 회원 3개월간 보상 50%만 지급
 */

import {
  doc, collection, addDoc, getDoc, getDocs, updateDoc, setDoc,
  runTransaction, query, where, orderBy, limit,
  serverTimestamp, Timestamp, increment,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  PointTransaction, PointBalance, PointTxType, PointTxStatus,
} from '@/types';
import { RAB_POLICY } from '@/types';

const COL = {
  BALANCES: 'rab_balances',
  TRANSACTIONS: 'rab_transactions',
} as const;

/* ─────────────────────────────────────
   잔액 조회
───────────────────────────────────── */

export async function getBalance(userId: string): Promise<PointBalance | null> {
  const snap = await getDoc(doc(db, COL.BALANCES, userId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    ...d,
    updatedAt: (d.updatedAt as Timestamp)?.toDate() ?? new Date(),
  } as PointBalance;
}

export async function getOrCreateBalance(userId: string): Promise<PointBalance> {
  const existing = await getBalance(userId);
  if (existing) return existing;

  const initial: Omit<PointBalance, 'updatedAt'> & { updatedAt: any } = {
    userId,
    balance: 0,
    pendingBalance: 0,
    totalEarned: 0,
    totalSpent: 0,
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, COL.BALANCES, userId), initial);
  return { ...initial, updatedAt: new Date() };
}

/* ─────────────────────────────────────
   트랜잭션 목록 조회
───────────────────────────────────── */

export async function getTransactions(
  userId: string,
  limitCount = 30
): Promise<PointTransaction[]> {
  const q = query(
    collection(db, COL.TRANSACTIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    ...d.data(),
    id: d.id,
    createdAt: (d.data().createdAt as Timestamp)?.toDate() ?? new Date(),
    confirmedAt: d.data().confirmedAt
      ? (d.data().confirmedAt as Timestamp).toDate()
      : undefined,
  })) as PointTransaction[];
}

/* ─────────────────────────────────────
   내부 헬퍼: 트랜잭션 기록 + 잔액 갱신
───────────────────────────────────── */

async function recordTx(
  userId: string,
  type: PointTxType,
  amount: number,         // 양수 or 음수
  description: string,
  opts: {
    status?: PointTxStatus;
    relatedCaseId?: string;
    relatedUserId?: string;
    isPending?: boolean;
  } = {}
): Promise<string> {
  const { status = 'confirmed', isPending = false } = opts;

  return await runTransaction(db, async (tx) => {
    const balRef = doc(db, COL.BALANCES, userId);
    const balSnap = await tx.get(balRef);

    let current: PointBalance;
    if (!balSnap.exists()) {
      current = {
        userId, balance: 0, pendingBalance: 0,
        totalEarned: 0, totalSpent: 0, updatedAt: new Date(),
      };
    } else {
      const d = balSnap.data();
      current = { ...d, updatedAt: (d.updatedAt as Timestamp).toDate() } as PointBalance;
    }

    // 소비 시 잔액 부족 체크
    if (amount < 0 && current.balance + amount < 0) {
      throw new Error(`RAB 잔액이 부족합니다. 현재: ${current.balance} RAB`);
    }

    const newBalance = isPending
      ? current.balance
      : Math.max(0, current.balance + amount);
    const newPending = isPending
      ? current.pendingBalance + amount
      : current.pendingBalance;
    const newEarned = amount > 0 ? current.totalEarned + amount : current.totalEarned;
    const newSpent = amount < 0 ? current.totalSpent + Math.abs(amount) : current.totalSpent;

    // 잔액 업데이트
    tx.set(balRef, {
      userId,
      balance: newBalance,
      pendingBalance: newPending,
      totalEarned: newEarned,
      totalSpent: newSpent,
      updatedAt: serverTimestamp(),
    });

    // 트랜잭션 기록
    const txRef = doc(collection(db, COL.TRANSACTIONS));
    const confirmedAt = isPending
      ? Timestamp.fromDate(
          new Date(Date.now() + RAB_POLICY.UPLOAD_PENDING_HOURS * 60 * 60 * 1000)
        )
      : serverTimestamp();

    tx.set(txRef, {
      userId,
      type,
      amount,
      balanceAfter: newBalance,
      status: isPending ? 'pending' : status,
      description,
      relatedCaseId: opts.relatedCaseId ?? null,
      relatedUserId: opts.relatedUserId ?? null,
      confirmedAt: isPending ? confirmedAt : null,
      createdAt: serverTimestamp(),
    });

    return txRef.id;
  });
}

/* ─────────────────────────────────────
   이번 달 업로드 보상 수령 건수 확인
───────────────────────────────────── */

async function getMonthlyUploadRewardCount(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, COL.TRANSACTIONS),
    where('userId', '==', userId),
    where('type', '==', 'UPLOAD_REWARD'),
    where('createdAt', '>=', Timestamp.fromDate(startOfMonth))
  );
  const snap = await getDocs(q);
  return snap.size;
}

/* ─────────────────────────────────────
   신규 회원 여부 확인
───────────────────────────────────── */

function isNewUser(createdAt: Date): boolean {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - RAB_POLICY.NEW_USER_MONTHS);
  return createdAt > threeMonthsAgo;
}

/* ─────────────────────────────────────
   공개 API: 포인트 이벤트
───────────────────────────────────── */

/** 1. 회원가입 보너스 */
export async function awardSignupBonus(userId: string): Promise<void> {
  // 이미 지급했는지 확인
  const q = query(
    collection(db, COL.TRANSACTIONS),
    where('userId', '==', userId),
    where('type', '==', 'SIGNUP_BONUS'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (!snap.empty) return; // 이미 지급됨

  await recordTx(
    userId,
    'SIGNUP_BONUS',
    RAB_POLICY.SIGNUP_BONUS,
    `회원가입 보너스 +${RAB_POLICY.SIGNUP_BONUS} RAB`
  );
}

/** 2. 케이스 업로드 보상 (48h pending) */
export async function awardUploadReward(
  userId: string,
  caseId: string,
  userCreatedAt: Date
): Promise<{ awarded: boolean; reason?: string; amount: number }> {
  // 월 상한 확인
  const monthlyCount = await getMonthlyUploadRewardCount(userId);
  if (monthlyCount >= RAB_POLICY.MONTHLY_UPLOAD_CAP) {
    return {
      awarded: false,
      reason: `월 업로드 보상 상한(${RAB_POLICY.MONTHLY_UPLOAD_CAP}건)에 도달했습니다`,
      amount: 0,
    };
  }

  // 신규 회원 여부
  const baseAmount = RAB_POLICY.UPLOAD_BASE;
  const amount = isNewUser(userCreatedAt)
    ? Math.floor(baseAmount * RAB_POLICY.NEW_USER_RATE)
    : baseAmount;

  await recordTx(
    userId,
    'UPLOAD_REWARD',
    amount,
    `케이스 업로드 보상 (48시간 후 확정) +${amount} RAB`,
    { isPending: true, relatedCaseId: caseId }
  );

  return { awarded: true, amount };
}

/** 3. 품질 보너스 확정 (AI/커뮤니티 검수 후 호출) */
export async function awardQualityBonus(
  userId: string,
  caseId: string,
  qualityScore: number // 0~100
): Promise<void> {
  const bonus = Math.floor(
    (qualityScore / 100) * RAB_POLICY.UPLOAD_QUALITY_MAX
  );
  if (bonus <= 0) return;

  await recordTx(
    userId,
    'UPLOAD_QUALITY_BONUS',
    bonus,
    `케이스 품질 보너스 (점수: ${qualityScore}) +${bonus} RAB`,
    { relatedCaseId: caseId }
  );
}

/** 4. 좋아요 수신 보상 */
export async function awardLikeReward(
  uploaderUserId: string,
  likerUserId: string,
  caseId: string
): Promise<void> {
  await recordTx(
    uploaderUserId,
    'LIKE_RECEIVED',
    RAB_POLICY.LIKE_REWARD,
    `케이스 좋아요 수신 +${RAB_POLICY.LIKE_REWARD} RAB`,
    { relatedCaseId: caseId, relatedUserId: likerUserId }
  );
}

/** 5. 시청: 소비 + 업로더 배분 */
export async function processViewPayment(
  viewerUserId: string,
  uploaderUserId: string,
  caseId: string,
  caseTitle: string
): Promise<void> {
  const cost = RAB_POLICY.VIEW_COST;
  const uploaderShare = Math.floor(cost * RAB_POLICY.VIEW_UPLOADER_SHARE);

  // 시청자 소비
  await recordTx(
    viewerUserId,
    'VIEW_SPEND',
    -cost,
    `케이스 시청: ${caseTitle}`,
    { relatedCaseId: caseId, relatedUserId: uploaderUserId }
  );

  // 업로더 수익 (단, 본인 케이스 시청 시 배분 없음)
  if (viewerUserId !== uploaderUserId) {
    await recordTx(
      uploaderUserId,
      'VIEW_SHARE',
      uploaderShare,
      `시청료 수익 배분 (70%): ${caseTitle} +${uploaderShare} RAB`,
      { relatedCaseId: caseId, relatedUserId: viewerUserId }
    );
  }
}

/** 6. 다운로드 소비 */
export async function processDownloadPayment(
  userId: string,
  caseId: string,
  caseTitle: string
): Promise<void> {
  await recordTx(
    userId,
    'DOWNLOAD_SPEND',
    -RAB_POLICY.DOWNLOAD_COST,
    `케이스 다운로드: ${caseTitle}`,
    { relatedCaseId: caseId }
  );
}

/** 7. 홍보 부스트 소비 */
export async function processBoostPayment(
  userId: string,
  caseId: string
): Promise<void> {
  await recordTx(
    userId,
    'BOOST_SPEND',
    -RAB_POLICY.BOOST_COST,
    `케이스 피드 부스트`,
    { relatedCaseId: caseId }
  );
}

/** 8. 신고 보상 */
export async function awardReportReward(
  reporterUserId: string,
  caseId: string
): Promise<void> {
  await recordTx(
    reporterUserId,
    'REPORT_REWARD',
    2,
    `신고 검수 기여 보상 +2 RAB`,
    { relatedCaseId: caseId }
  );
}

/** 9. 페널티 차감 */
export async function applyPenalty(
  userId: string,
  caseId: string,
  reason: string
): Promise<void> {
  await recordTx(
    userId,
    'PENALTY_DEDUCT',
    -RAB_POLICY.UPLOAD_BASE,
    `불량 케이스 패널티: ${reason}`,
    { relatedCaseId: caseId }
  );
}

/** 10. pending 트랜잭션 확정 (Cloud Scheduler or 수동 호출) */
export async function confirmPendingTransactions(userId: string): Promise<number> {
  const now = new Date();
  const q = query(
    collection(db, COL.TRANSACTIONS),
    where('userId', '==', userId),
    where('status', '==', 'pending'),
    where('confirmedAt', '<=', Timestamp.fromDate(now))
  );
  const snap = await getDocs(q);
  let confirmed = 0;

  for (const docSnap of snap.docs) {
    const tx = docSnap.data();
    await runTransaction(db, async (t) => {
      const balRef = doc(db, COL.BALANCES, userId);
      const balSnap = await t.get(balRef);
      if (!balSnap.exists()) return;

      const bal = balSnap.data();
      t.update(balRef, {
        balance: bal.balance + tx.amount,
        pendingBalance: Math.max(0, bal.pendingBalance - tx.amount),
        totalEarned: bal.totalEarned + tx.amount,
        updatedAt: serverTimestamp(),
      });
      t.update(doc(db, COL.TRANSACTIONS, docSnap.id), {
        status: 'confirmed',
      });
    });
    confirmed++;
  }
  return confirmed;
}

/** 11. 관리자 RAB 지급 / 차감 */
export async function creditBalanceAdmin(
  userId: string,
  amount: number,   // 양수: 지급, 음수: 차감
  description: string,
  relatedCaseId?: string
): Promise<void> {
  await recordTx(
    userId,
    amount > 0 ? 'ADMIN_GRANT' : 'ADMIN_DEDUCT',
    amount,
    description,
    { relatedCaseId }
  );
}
