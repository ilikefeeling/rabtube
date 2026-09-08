/**
 * Admin Service
 * 관리자 전용 Firestore 쿼리 및 RAB 수동 지급/차감
 */

import {
  collection, doc, getDocs, getDoc, setDoc, query,
  where, orderBy, limit, startAfter, runTransaction,
  serverTimestamp, Timestamp, onSnapshot,
  QueryDocumentSnapshot, DocumentData, deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile, PointTransaction, PointBalance } from '@/types';

const COL = {
  USERS: 'users',
  CASES: 'cases',
  BALANCES: 'rab_balances',
  TRANSACTIONS: 'rab_transactions',
} as const;

/* ─────────────────────────────────────
   대시보드 집계 지표
───────────────────────────────────── */

export interface DashboardStats {
  totalMembers: number;
  totalCases: number;
  totalSupply: number;          // 전체 유통 중인 RAB
  totalEverIssued: number;      // 누적 발행
  totalEverBurned: number;      // 누적 소각 (spent)
  totalPlatformRevenue: number; // 플랫폼 누적 수익
  pendingTxCount: number;       // 대기 중 트랜잭션 수
  todayTxCount: number;         // 오늘 트랜잭션 수
  avgBalance: number;           // 평균 회원 잔액
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [membersSnap, casesSnap, balancesSnap, pendingSnap, todaySnap] = await Promise.all([
    getDocs(collection(db, COL.USERS)),
    getDocs(collection(db, COL.CASES)),
    getDocs(collection(db, COL.BALANCES)),
    getDocs(query(
      collection(db, COL.TRANSACTIONS),
      where('status', '==', 'pending')
    )),
    getDocs(query(
      collection(db, COL.TRANSACTIONS),
      where('createdAt', '>=', Timestamp.fromDate(startOfDay())),
    )),
  ]);

  let totalSupply = 0, totalEarned = 0, totalSpent = 0;
  balancesSnap.docs.forEach(d => {
    const b = d.data();
    totalSupply  += b.balance ?? 0;
    totalEarned  += b.totalEarned ?? 0;
    totalSpent   += b.totalSpent ?? 0;
  });

  // 플랫폼 수익 = 발행 - (업로더 배분) - 소각
  // 실제로는 ADMIN_GRANT 타입 트랜잭션에서 플랫폼 수익 누적
  const platformSnap = await getDocs(query(
    collection(db, COL.TRANSACTIONS),
    where('type', '==', 'VIEW_SPEND'),
  ));
  const totalPlatformRevenue = platformSnap.docs.reduce((s, d) => {
    return s + Math.round(Math.abs(d.data().amount) * 0.2);
  }, 0);

  const avgBalance = membersSnap.size > 0
    ? Math.round(totalSupply / membersSnap.size) : 0;

  return {
    totalMembers: membersSnap.size,
    totalCases: casesSnap.size,
    totalSupply,
    totalEverIssued: totalEarned,
    totalEverBurned: totalSpent,
    totalPlatformRevenue,
    pendingTxCount: pendingSnap.size,
    todayTxCount: todaySnap.size,
    avgBalance,
  };
}

/* ─────────────────────────────────────
   실시간 트랜잭션 스트림
───────────────────────────────────── */

export function subscribeRecentTransactions(
  callback: (txs: PointTransaction[]) => void,
  count = 50
) {
  const q = query(
    collection(db, COL.TRANSACTIONS),
    orderBy('createdAt', 'desc'),
    limit(count)
  );
  return onSnapshot(q, snap => {
    const txs = snap.docs.map(d => ({
      ...d.data(),
      id: d.id,
      createdAt: (d.data().createdAt as Timestamp)?.toDate() ?? new Date(),
      confirmedAt: d.data().confirmedAt
        ? (d.data().confirmedAt as Timestamp).toDate()
        : undefined,
    })) as PointTransaction[];
    callback(txs);
  });
}

/* ─────────────────────────────────────
   전체 회원 + 잔액 목록
───────────────────────────────────── */

export interface MemberWithBalance extends UserProfile {
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalSpent: number;
}

export async function getMembersWithBalance(): Promise<MemberWithBalance[]> {
  const [usersSnap, balancesSnap] = await Promise.all([
    getDocs(query(collection(db, COL.USERS), orderBy('createdAt', 'desc'))),
    getDocs(collection(db, COL.BALANCES)),
  ]);

  const balanceMap = new Map<string, any>();
  balancesSnap.docs.forEach(d => balanceMap.set(d.id, d.data()));

  return usersSnap.docs.map(d => {
    const user = d.data();
    const bal = balanceMap.get(d.id) ?? { balance: 0, pendingBalance: 0, totalEarned: 0, totalSpent: 0 };
    return {
      ...user,
      uid: d.id,
      createdAt: (user.createdAt as Timestamp)?.toDate() ?? new Date(),
      balance: bal.balance ?? 0,
      pendingBalance: bal.pendingBalance ?? 0,
      totalEarned: bal.totalEarned ?? 0,
      totalSpent: bal.totalSpent ?? 0,
    } as MemberWithBalance;
  });
}

/* ─────────────────────────────────────
   회원별 트랜잭션 조회
───────────────────────────────────── */

export async function getMemberTransactions(
  userId: string,
  count = 20
): Promise<PointTransaction[]> {
  const q = query(
    collection(db, COL.TRANSACTIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    ...d.data(),
    id: d.id,
    createdAt: (d.data().createdAt as Timestamp)?.toDate() ?? new Date(),
  })) as PointTransaction[];
}

/* ─────────────────────────────────────
   수동 지급 / 차감
───────────────────────────────────── */

export interface AdminAdjustmentInput {
  targetUserId: string;
  amount: number;        // 양수: 지급, 음수: 차감
  reason: string;
  adminUserId: string;
}

export async function adminAdjustPoints(input: AdminAdjustmentInput): Promise<void> {
  const { targetUserId, amount, reason, adminUserId } = input;
  if (amount === 0) throw new Error('금액은 0이 될 수 없습니다');
  if (!reason.trim()) throw new Error('사유를 입력해 주세요');

  // 관리자 권한 확인
  const adminSnap = await getDoc(doc(db, COL.USERS, adminUserId));
  if (!adminSnap.exists() || adminSnap.data().role !== 'admin') {
    throw new Error('관리자 권한이 없습니다');
  }

  await runTransaction(db, async tx => {
    const balRef = doc(db, COL.BALANCES, targetUserId);
    const balSnap = await tx.get(balRef);

    let current = { balance: 0, pendingBalance: 0, totalEarned: 0, totalSpent: 0 };
    if (balSnap.exists()) {
      const d = balSnap.data();
      current = {
        balance: d.balance ?? 0,
        pendingBalance: d.pendingBalance ?? 0,
        totalEarned: d.totalEarned ?? 0,
        totalSpent: d.totalSpent ?? 0,
      };
    }

    const newBalance = Math.max(0, current.balance + amount);
    if (amount < 0 && current.balance + amount < 0) {
      throw new Error(`차감 불가: 현재 잔액(${current.balance} RAB) 부족`);
    }

    tx.set(balRef, {
      userId: targetUserId,
      balance: newBalance,
      pendingBalance: current.pendingBalance,
      totalEarned: amount > 0 ? current.totalEarned + amount : current.totalEarned,
      totalSpent:  amount < 0 ? current.totalSpent + Math.abs(amount) : current.totalSpent,
      updatedAt: serverTimestamp(),
    });

    const txRef = doc(collection(db, COL.TRANSACTIONS));
    tx.set(txRef, {
      userId: targetUserId,
      type: amount > 0 ? 'ADMIN_GRANT' : 'ADMIN_DEDUCT',
      amount,
      balanceAfter: newBalance,
      status: 'confirmed',
      description: `[관리자] ${reason}`,
      relatedUserId: adminUserId,
      confirmedAt: null,
      createdAt: serverTimestamp(),
    });
  });
}

/* ─────────────────────────────────────
   회원 상태 변경 (승인/거절)
───────────────────────────────────── */

export async function updateMemberStatus(
  targetUserId: string,
  status: 'pending' | 'approved' | 'rejected' | 'deleted',
  adminUserId: string
): Promise<void> {
  const adminSnap = await getDoc(doc(db, COL.USERS, adminUserId));
  if (!adminSnap.exists() || adminSnap.data().role !== 'admin') {
    throw new Error('관리자 권한이 없습니다');
  }
  await setDoc(doc(db, COL.USERS, targetUserId), { status }, { merge: true });
}

export async function deleteMember(
  targetUserId: string,
  phoneNumber: string | undefined,
  adminUserId: string
): Promise<void> {
  const adminSnap = await getDoc(doc(db, COL.USERS, adminUserId));
  if (!adminSnap.exists() || adminSnap.data().role !== 'admin') {
    throw new Error('관리자 권한이 없습니다');
  }
  
  // 1. users 문서 삭제
  await deleteDoc(doc(db, COL.USERS, targetUserId));
  
  // 2. phone_numbers 중복 방지용 문서 삭제
  if (phoneNumber) {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone) {
      await deleteDoc(doc(db, 'phone_numbers', cleanPhone));
    }
  }
}

/* ─────────────────────────────────────
   RAB 공급량 타임라인 (일별 집계)
───────────────────────────────────── */

export interface SupplyDataPoint {
  date: string;
  issued: number;
  burned: number;
  net: number;
}

export async function getSupplyTimeline(days = 30): Promise<SupplyDataPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const q = query(
    collection(db, COL.TRANSACTIONS),
    where('createdAt', '>=', Timestamp.fromDate(since)),
    where('status', '==', 'confirmed'),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);

  const byDay = new Map<string, { issued: number; burned: number }>();
  snap.docs.forEach(d => {
    const data = d.data();
    const date = (data.createdAt as Timestamp).toDate().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    const entry = byDay.get(date) ?? { issued: 0, burned: 0 };
    if (data.amount > 0) entry.issued += data.amount;
    else entry.burned += Math.abs(data.amount);
    byDay.set(date, entry);
  });

  return Array.from(byDay.entries()).map(([date, v]) => ({
    date,
    issued: v.issued,
    burned: v.burned,
    net: v.issued - v.burned,
  }));
}

/* ─────────────────────────────────────
   pending 트랜잭션 전체 확정 (관리자용)
───────────────────────────────────── */

export async function confirmAllPendingTransactions(): Promise<number> {
  const now = new Date();
  const q = query(
    collection(db, COL.TRANSACTIONS),
    where('status', '==', 'pending'),
    where('confirmedAt', '<=', Timestamp.fromDate(now)),
    limit(100)
  );
  const snap = await getDocs(q);
  let count = 0;

  for (const docSnap of snap.docs) {
    const tx = docSnap.data();
    try {
      await runTransaction(db, async t => {
        const balRef = doc(db, COL.BALANCES, tx.userId);
        const balSnap = await t.get(balRef);
        if (!balSnap.exists()) return;
        const bal = balSnap.data();
        t.update(balRef, {
          balance: (bal.balance ?? 0) + tx.amount,
          pendingBalance: Math.max(0, (bal.pendingBalance ?? 0) - tx.amount),
          totalEarned: (bal.totalEarned ?? 0) + tx.amount,
          updatedAt: serverTimestamp(),
        });
        t.update(doc(db, COL.TRANSACTIONS, docSnap.id), { status: 'confirmed' });
      });
      count++;
    } catch (e) { console.error(e); }
  }
  return count;
}

/* ── 헬퍼 ── */
function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
