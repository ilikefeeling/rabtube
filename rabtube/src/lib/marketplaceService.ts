/**
 * Dental B2B Marketplace Service
 * 치과 상품 제안 의뢰 → 제안 → 에스크로 정산
 *
 * 핵심 원칙:
 * - 모든 잔액 변경은 Firestore 트랜잭션으로 원자적 처리
 * - 바운티 RAB은 에스크로 동결 → 채택 시 정산 (80% 제안자, 15% 수수료, 5% 소각)
 * - 취소 시 90% 환급 (10% 취소 수수료), 만료 시 100% 환급
 * - 바운티 범위: 최소 100 RAB ~ 최대 10,000 RAB
 */

import {
  doc, collection, addDoc, getDoc, getDocs, updateDoc, setDoc,
  runTransaction, query, where, orderBy, limit,
  serverTimestamp, Timestamp, increment,
} from 'firebase/firestore';
import { db } from './firebase';

/* ═════════════════════════════════════
   타입 정의
═════════════════════════════════════ */

export type DentalCategory =
  | '임플란트_부속' | '레진_수복재료' | '인상재_석고' | '근관치료재료'
  | '교정재료' | '예방치과재료' | '소독_위생용품' | '진료실_소모품'
  | '수술용품' | '보철재료' | '디지털장비_부속' | '병원_운영용품' | '기타';

export type RequestStatus =
  | 'DRAFT' | 'OPEN' | 'IN_REVIEW' | 'ACCEPTED'
  | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

export type ProposalStatus =
  | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface DentalRequest {
  id?: string;
  requesterId: string;
  title: string;
  description: string;
  category: DentalCategory;
  specifications: string;
  quantity: number;
  unit: string;
  bountyRab: number;
  deadline: Date;
  status: RequestStatus;
  proposalCount: number;
  acceptedProposalId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DentalProposal {
  id?: string;
  proposerId: string;
  requestId: string;
  productName: string;
  manufacturer: string;
  unitPrice: number;
  currency: string;
  minOrderQty: number;
  leadTimeDays: number;
  description: string;
  certifications: string[];
  status: ProposalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface EscrowRecord {
  id?: string;
  requestId: string;
  requesterId: string;
  amount: number;
  type: 'FREEZE' | 'RELEASE' | 'REFUND' | 'FEE' | 'BURN';
  recipientId: string | null;
  description: string;
  createdAt: Date;
}

/* ═════════════════════════════════════
   상수
═════════════════════════════════════ */

const COL = {
  BALANCES: 'rab_balances',
  TRANSACTIONS: 'rab_transactions',
  REQUESTS: 'dental_requests',
  PROPOSALS: 'dental_proposals',
  ESCROW: 'escrow_ledger',
} as const;

const BOUNTY = {
  MIN: 100,
  MAX: 10_000,
  /** 채택 시 제안자 정산 비율 */
  PROPOSER_SHARE: 0.80,
  /** 채택 시 플랫폼 수수료 비율 */
  PLATFORM_FEE: 0.15,
  /** 채택 시 소각 비율 */
  BURN_RATE: 0.05,
  /** 취소 수수료 비율 */
  CANCEL_FEE: 0.10,
} as const;

/* ═════════════════════════════════════
   1. 의뢰 등록 + 바운티 에스크로 동결
═════════════════════════════════════ */

export async function createRequest(
  requesterId: string,
  data: {
    title: string;
    description: string;
    category: DentalCategory;
    specifications: string;
    quantity: number;
    unit: string;
    bountyRab: number;
    deadline: Date;
  }
): Promise<string> {
  const { bountyRab } = data;

  // 바운티 범위 검증
  if (bountyRab < BOUNTY.MIN || bountyRab > BOUNTY.MAX) {
    throw new Error(
      `바운티는 ${BOUNTY.MIN}~${BOUNTY.MAX} RAB 범위여야 합니다. 입력: ${bountyRab}`
    );
  }

  return await runTransaction(db, async (tx) => {
    // 1) 잔액 조회
    const balRef = doc(db, COL.BALANCES, requesterId);
    const balSnap = await tx.get(balRef);

    let balance = 0;
    let escrowBalance = 0;
    let pendingBalance = 0;
    let totalEarned = 0;
    let totalSpent = 0;

    if (balSnap.exists()) {
      const d = balSnap.data();
      balance = d.balance ?? 0;
      escrowBalance = d.escrowBalance ?? 0;
      pendingBalance = d.pendingBalance ?? 0;
      totalEarned = d.totalEarned ?? 0;
      totalSpent = d.totalSpent ?? 0;
    }

    // 2) 잔액 부족 체크
    if (balance < bountyRab) {
      throw new Error(
        `RAB 잔액이 부족합니다. 현재: ${balance} RAB, 필요: ${bountyRab} RAB`
      );
    }

    // 3) 잔액 차감 + 에스크로 증가
    tx.set(balRef, {
      userId: requesterId,
      balance: balance - bountyRab,
      escrowBalance: escrowBalance + bountyRab,
      pendingBalance,
      totalEarned,
      totalSpent: totalSpent + bountyRab,
      updatedAt: serverTimestamp(),
    });

    // 4) rab_transactions에 BOUNTY_ESCROW 기록
    const txRef = doc(collection(db, COL.TRANSACTIONS));
    tx.set(txRef, {
      userId: requesterId,
      type: 'BOUNTY_ESCROW',
      amount: -bountyRab,
      balanceAfter: balance - bountyRab,
      status: 'confirmed',
      description: `마켓플레이스 바운티 에스크로 동결: ${data.title}`,
      relatedCaseId: null,
      relatedUserId: null,
      commissionRateApplied: null,
      confirmedAt: null,
      createdAt: serverTimestamp(),
    });

    // 5) dental_requests에 의뢰 문서 생성
    const reqRef = doc(collection(db, COL.REQUESTS));
    tx.set(reqRef, {
      requesterId,
      title: data.title,
      description: data.description,
      category: data.category,
      specifications: data.specifications,
      quantity: data.quantity,
      unit: data.unit,
      bountyRab,
      deadline: Timestamp.fromDate(data.deadline),
      status: 'OPEN' as RequestStatus,
      proposalCount: 0,
      acceptedProposalId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 6) escrow_ledger에 에스크로 기록
    const escrowRef = doc(collection(db, COL.ESCROW));
    tx.set(escrowRef, {
      requestId: reqRef.id,
      requesterId,
      amount: bountyRab,
      type: 'FREEZE',
      recipientId: null,
      description: `바운티 에스크로 동결: ${data.title}`,
      createdAt: serverTimestamp(),
    });

    return reqRef.id;
  });
}

/* ═════════════════════════════════════
   2. 의뢰 목록 조회
═════════════════════════════════════ */

export async function getRequests(
  filters?: {
    status?: RequestStatus;
    category?: DentalCategory;
    limitCount?: number;
  }
): Promise<DentalRequest[]> {
  const constraints: any[] = [];
  const status = filters?.status ?? 'OPEN';

  constraints.push(where('status', '==', status));

  if (filters?.category) {
    constraints.push(where('category', '==', filters.category));
  }

  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(filters?.limitCount ?? 50));

  const q = query(collection(db, COL.REQUESTS), ...constraints);
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      deadline: (data.deadline as Timestamp)?.toDate() ?? new Date(),
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
    } as DentalRequest;
  });
}

/* ═════════════════════════════════════
   3. 의뢰 상세 + 제안 목록
═════════════════════════════════════ */

export async function getRequestById(
  id: string
): Promise<{ request: DentalRequest; proposals: DentalProposal[] } | null> {
  // 의뢰 조회
  const reqSnap = await getDoc(doc(db, COL.REQUESTS, id));
  if (!reqSnap.exists()) return null;

  const reqData = reqSnap.data();
  const request: DentalRequest = {
    ...reqData,
    id: reqSnap.id,
    deadline: (reqData.deadline as Timestamp)?.toDate() ?? new Date(),
    createdAt: (reqData.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (reqData.updatedAt as Timestamp)?.toDate() ?? new Date(),
  } as DentalRequest;

  // 해당 의뢰의 제안 목록
  const q = query(
    collection(db, COL.PROPOSALS),
    where('requestId', '==', id),
    orderBy('createdAt', 'desc')
  );
  const propSnap = await getDocs(q);
  const proposals: DentalProposal[] = propSnap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
    } as DentalProposal;
  });

  return { request, proposals };
}

/* ═════════════════════════════════════
   4. 제안 제출
═════════════════════════════════════ */

export async function createProposal(
  proposerId: string,
  requestId: string,
  data: {
    productName: string;
    manufacturer: string;
    unitPrice: number;
    currency: string;
    minOrderQty: number;
    leadTimeDays: number;
    description: string;
    certifications: string[];
  }
): Promise<string> {
  return await runTransaction(db, async (tx) => {
    // 의뢰 존재 & 상태 확인
    const reqRef = doc(db, COL.REQUESTS, requestId);
    const reqSnap = await tx.get(reqRef);

    if (!reqSnap.exists()) {
      throw new Error('존재하지 않는 의뢰입니다.');
    }

    const reqData = reqSnap.data();
    if (reqData.status !== 'OPEN') {
      throw new Error(`의뢰가 제안 접수 중이 아닙니다. 현재 상태: ${reqData.status}`);
    }

    // 의뢰자 본인 제안 방지
    if (reqData.requesterId === proposerId) {
      throw new Error('본인의 의뢰에는 제안할 수 없습니다.');
    }

    // 제안 문서 생성
    const propRef = doc(collection(db, COL.PROPOSALS));
    tx.set(propRef, {
      proposerId,
      requestId,
      productName: data.productName,
      manufacturer: data.manufacturer,
      unitPrice: data.unitPrice,
      currency: data.currency,
      minOrderQty: data.minOrderQty,
      leadTimeDays: data.leadTimeDays,
      description: data.description,
      certifications: data.certifications,
      status: 'SUBMITTED' as ProposalStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // proposalCount 증가
    tx.update(reqRef, {
      proposalCount: (reqData.proposalCount ?? 0) + 1,
      updatedAt: serverTimestamp(),
    });

    return propRef.id;
  });
}

/* ═════════════════════════════════════
   5. 제안 채택 — 에스크로 정산
═════════════════════════════════════ */

export async function acceptProposal(
  requesterId: string,
  requestId: string,
  proposalId: string
): Promise<void> {
  await runTransaction(db, async (tx) => {
    // ── 의뢰 확인 ──
    const reqRef = doc(db, COL.REQUESTS, requestId);
    const reqSnap = await tx.get(reqRef);

    if (!reqSnap.exists()) {
      throw new Error('존재하지 않는 의뢰입니다.');
    }
    const reqData = reqSnap.data();

    if (reqData.requesterId !== requesterId) {
      throw new Error('의뢰 등록자만 제안을 채택할 수 있습니다.');
    }
    if (reqData.status !== 'OPEN' && reqData.status !== 'IN_REVIEW') {
      throw new Error(`채택 불가 상태입니다. 현재: ${reqData.status}`);
    }

    // ── 제안 확인 ──
    const propRef = doc(db, COL.PROPOSALS, proposalId);
    const propSnap = await tx.get(propRef);

    if (!propSnap.exists()) {
      throw new Error('존재하지 않는 제안입니다.');
    }
    const propData = propSnap.data();

    if (propData.requestId !== requestId) {
      throw new Error('해당 의뢰에 속하지 않는 제안입니다.');
    }
    if (propData.status !== 'SUBMITTED') {
      throw new Error(`채택 불가 제안 상태입니다. 현재: ${propData.status}`);
    }

    const bountyRab = reqData.bountyRab as number;
    const proposerId = propData.proposerId as string;

    // ── 정산 계산 ──
    const proposerAmount = Math.floor(bountyRab * BOUNTY.PROPOSER_SHARE);
    const platformFee = Math.floor(bountyRab * BOUNTY.PLATFORM_FEE);
    const burnAmount = bountyRab - proposerAmount - platformFee; // 나머지 = 소각

    // ── 의뢰자 에스크로 차감 ──
    const requesterBalRef = doc(db, COL.BALANCES, requesterId);
    const requesterBalSnap = await tx.get(requesterBalRef);

    let rEscrow = 0;
    let rBalance = 0;
    let rPending = 0;
    let rEarned = 0;
    let rSpent = 0;

    if (requesterBalSnap.exists()) {
      const d = requesterBalSnap.data();
      rEscrow = d.escrowBalance ?? 0;
      rBalance = d.balance ?? 0;
      rPending = d.pendingBalance ?? 0;
      rEarned = d.totalEarned ?? 0;
      rSpent = d.totalSpent ?? 0;
    }

    tx.set(requesterBalRef, {
      userId: requesterId,
      balance: rBalance,
      escrowBalance: Math.max(0, rEscrow - bountyRab),
      pendingBalance: rPending,
      totalEarned: rEarned,
      totalSpent: rSpent,
      updatedAt: serverTimestamp(),
    });

    // ── 제안자 잔액 증가 ──
    const proposerBalRef = doc(db, COL.BALANCES, proposerId);
    const proposerBalSnap = await tx.get(proposerBalRef);

    let pBalance = 0;
    let pEscrow = 0;
    let pPending = 0;
    let pEarned = 0;
    let pSpent = 0;

    if (proposerBalSnap.exists()) {
      const d = proposerBalSnap.data();
      pBalance = d.balance ?? 0;
      pEscrow = d.escrowBalance ?? 0;
      pPending = d.pendingBalance ?? 0;
      pEarned = d.totalEarned ?? 0;
      pSpent = d.totalSpent ?? 0;
    }

    tx.set(proposerBalRef, {
      userId: proposerId,
      balance: pBalance + proposerAmount,
      escrowBalance: pEscrow,
      pendingBalance: pPending,
      totalEarned: pEarned + proposerAmount,
      totalSpent: pSpent,
      updatedAt: serverTimestamp(),
    });

    // ── rab_transactions 기록 ──

    // BOUNTY_RELEASE: 제안자 수령
    const releaseTxRef = doc(collection(db, COL.TRANSACTIONS));
    tx.set(releaseTxRef, {
      userId: proposerId,
      type: 'BOUNTY_RELEASE',
      amount: proposerAmount,
      balanceAfter: pBalance + proposerAmount,
      status: 'confirmed',
      description: `바운티 정산 수령 (${Math.round(BOUNTY.PROPOSER_SHARE * 100)}%): ${reqData.title}`,
      relatedCaseId: requestId,
      relatedUserId: requesterId,
      commissionRateApplied: BOUNTY.PLATFORM_FEE,
      confirmedAt: null,
      createdAt: serverTimestamp(),
    });

    // BOUNTY_FEE: 플랫폼 수수료
    const feeTxRef = doc(collection(db, COL.TRANSACTIONS));
    tx.set(feeTxRef, {
      userId: requesterId,
      type: 'BOUNTY_FEE',
      amount: -platformFee,
      balanceAfter: rBalance,
      status: 'confirmed',
      description: `바운티 플랫폼 수수료 (${Math.round(BOUNTY.PLATFORM_FEE * 100)}%): ${reqData.title}`,
      relatedCaseId: requestId,
      relatedUserId: null,
      commissionRateApplied: BOUNTY.PLATFORM_FEE,
      confirmedAt: null,
      createdAt: serverTimestamp(),
    });

    // BOUNTY_BURN: 소각
    const burnTxRef = doc(collection(db, COL.TRANSACTIONS));
    tx.set(burnTxRef, {
      userId: requesterId,
      type: 'BOUNTY_BURN',
      amount: -burnAmount,
      balanceAfter: rBalance,
      status: 'confirmed',
      description: `바운티 소각 (${Math.round(BOUNTY.BURN_RATE * 100)}%): ${reqData.title}`,
      relatedCaseId: requestId,
      relatedUserId: null,
      commissionRateApplied: BOUNTY.BURN_RATE,
      confirmedAt: null,
      createdAt: serverTimestamp(),
    });

    // ── escrow_ledger 기록 ──
    const escrowReleaseRef = doc(collection(db, COL.ESCROW));
    tx.set(escrowReleaseRef, {
      requestId,
      requesterId,
      amount: proposerAmount,
      type: 'RELEASE',
      recipientId: proposerId,
      description: `바운티 정산 → 제안자 ${proposerAmount} RAB`,
      createdAt: serverTimestamp(),
    });

    const escrowFeeRef = doc(collection(db, COL.ESCROW));
    tx.set(escrowFeeRef, {
      requestId,
      requesterId,
      amount: platformFee,
      type: 'FEE',
      recipientId: null,
      description: `플랫폼 수수료 ${platformFee} RAB`,
      createdAt: serverTimestamp(),
    });

    const escrowBurnRef = doc(collection(db, COL.ESCROW));
    tx.set(escrowBurnRef, {
      requestId,
      requesterId,
      amount: burnAmount,
      type: 'BURN',
      recipientId: null,
      description: `소각 ${burnAmount} RAB`,
      createdAt: serverTimestamp(),
    });

    // ── 의뢰 & 제안 상태 업데이트 ──
    tx.update(reqRef, {
      status: 'ACCEPTED' as RequestStatus,
      acceptedProposalId: proposalId,
      updatedAt: serverTimestamp(),
    });

    tx.update(propRef, {
      status: 'ACCEPTED' as ProposalStatus,
      updatedAt: serverTimestamp(),
    });
  });
}

/* ═════════════════════════════════════
   6. 의뢰 취소 — 에스크로 90% 환급
═════════════════════════════════════ */

export async function cancelRequest(
  requesterId: string,
  requestId: string
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const reqRef = doc(db, COL.REQUESTS, requestId);
    const reqSnap = await tx.get(reqRef);

    if (!reqSnap.exists()) {
      throw new Error('존재하지 않는 의뢰입니다.');
    }
    const reqData = reqSnap.data();

    if (reqData.requesterId !== requesterId) {
      throw new Error('의뢰 등록자만 취소할 수 있습니다.');
    }
    if (reqData.status !== 'OPEN' && reqData.status !== 'DRAFT') {
      throw new Error(`취소 불가 상태입니다. 현재: ${reqData.status}`);
    }

    const bountyRab = reqData.bountyRab as number;
    const cancelFee = Math.floor(bountyRab * BOUNTY.CANCEL_FEE);
    const refundAmount = bountyRab - cancelFee;

    // ── 잔액 업데이트: 에스크로 차감 + balance 환급 ──
    const balRef = doc(db, COL.BALANCES, requesterId);
    const balSnap = await tx.get(balRef);

    let balance = 0;
    let escrowBalance = 0;
    let pendingBalance = 0;
    let totalEarned = 0;
    let totalSpent = 0;

    if (balSnap.exists()) {
      const d = balSnap.data();
      balance = d.balance ?? 0;
      escrowBalance = d.escrowBalance ?? 0;
      pendingBalance = d.pendingBalance ?? 0;
      totalEarned = d.totalEarned ?? 0;
      totalSpent = d.totalSpent ?? 0;
    }

    tx.set(balRef, {
      userId: requesterId,
      balance: balance + refundAmount,
      escrowBalance: Math.max(0, escrowBalance - bountyRab),
      pendingBalance,
      totalEarned: totalEarned + refundAmount,
      totalSpent,
      updatedAt: serverTimestamp(),
    });

    // ── rab_transactions 기록 ──
    const refundTxRef = doc(collection(db, COL.TRANSACTIONS));
    tx.set(refundTxRef, {
      userId: requesterId,
      type: 'BOUNTY_REFUND',
      amount: refundAmount,
      balanceAfter: balance + refundAmount,
      status: 'confirmed',
      description: `의뢰 취소 환급 (${Math.round((1 - BOUNTY.CANCEL_FEE) * 100)}%): ${reqData.title}`,
      relatedCaseId: requestId,
      relatedUserId: null,
      commissionRateApplied: BOUNTY.CANCEL_FEE,
      confirmedAt: null,
      createdAt: serverTimestamp(),
    });

    if (cancelFee > 0) {
      const feeTxRef = doc(collection(db, COL.TRANSACTIONS));
      tx.set(feeTxRef, {
        userId: requesterId,
        type: 'BOUNTY_FEE',
        amount: -cancelFee,
        balanceAfter: balance + refundAmount,
        status: 'confirmed',
        description: `의뢰 취소 수수료 (${Math.round(BOUNTY.CANCEL_FEE * 100)}%): ${reqData.title}`,
        relatedCaseId: requestId,
        relatedUserId: null,
        commissionRateApplied: BOUNTY.CANCEL_FEE,
        confirmedAt: null,
        createdAt: serverTimestamp(),
      });
    }

    // ── escrow_ledger 기록 ──
    const escrowRefundRef = doc(collection(db, COL.ESCROW));
    tx.set(escrowRefundRef, {
      requestId,
      requesterId,
      amount: refundAmount,
      type: 'REFUND',
      recipientId: requesterId,
      description: `의뢰 취소 환급 ${refundAmount} RAB (수수료 ${cancelFee} RAB 차감)`,
      createdAt: serverTimestamp(),
    });

    // ── 의뢰 상태 업데이트 ──
    tx.update(reqRef, {
      status: 'CANCELLED' as RequestStatus,
      updatedAt: serverTimestamp(),
    });
  });
}

/* ═════════════════════════════════════
   7. 의뢰 자동 만료 — 에스크로 100% 환급
═════════════════════════════════════ */

export async function expireRequest(requestId: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const reqRef = doc(db, COL.REQUESTS, requestId);
    const reqSnap = await tx.get(reqRef);

    if (!reqSnap.exists()) {
      throw new Error('존재하지 않는 의뢰입니다.');
    }
    const reqData = reqSnap.data();

    if (reqData.status !== 'OPEN') {
      throw new Error(`만료 처리 불가 상태입니다. 현재: ${reqData.status}`);
    }

    // 마감일 초과 확인
    const deadline = (reqData.deadline as Timestamp)?.toDate();
    if (deadline && deadline > new Date()) {
      throw new Error('아직 마감일이 지나지 않았습니다.');
    }

    const bountyRab = reqData.bountyRab as number;
    const requesterId = reqData.requesterId as string;

    // ── 잔액 업데이트: 에스크로 차감 + 100% 환급 ──
    const balRef = doc(db, COL.BALANCES, requesterId);
    const balSnap = await tx.get(balRef);

    let balance = 0;
    let escrowBalance = 0;
    let pendingBalance = 0;
    let totalEarned = 0;
    let totalSpent = 0;

    if (balSnap.exists()) {
      const d = balSnap.data();
      balance = d.balance ?? 0;
      escrowBalance = d.escrowBalance ?? 0;
      pendingBalance = d.pendingBalance ?? 0;
      totalEarned = d.totalEarned ?? 0;
      totalSpent = d.totalSpent ?? 0;
    }

    tx.set(balRef, {
      userId: requesterId,
      balance: balance + bountyRab,
      escrowBalance: Math.max(0, escrowBalance - bountyRab),
      pendingBalance,
      totalEarned: totalEarned + bountyRab,
      totalSpent,
      updatedAt: serverTimestamp(),
    });

    // ── rab_transactions 기록 ──
    const refundTxRef = doc(collection(db, COL.TRANSACTIONS));
    tx.set(refundTxRef, {
      userId: requesterId,
      type: 'BOUNTY_REFUND',
      amount: bountyRab,
      balanceAfter: balance + bountyRab,
      status: 'confirmed',
      description: `의뢰 만료 전액 환급: ${reqData.title}`,
      relatedCaseId: requestId,
      relatedUserId: null,
      commissionRateApplied: null,
      confirmedAt: null,
      createdAt: serverTimestamp(),
    });

    // ── escrow_ledger 기록 ──
    const escrowRefundRef = doc(collection(db, COL.ESCROW));
    tx.set(escrowRefundRef, {
      requestId,
      requesterId,
      amount: bountyRab,
      type: 'REFUND',
      recipientId: requesterId,
      description: `의뢰 만료 전액 환급 ${bountyRab} RAB`,
      createdAt: serverTimestamp(),
    });

    // ── 의뢰 상태 업데이트 ──
    tx.update(reqRef, {
      status: 'EXPIRED' as RequestStatus,
      updatedAt: serverTimestamp(),
    });
  });
}
