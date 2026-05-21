/**
 * 품질 점수 산정 엔진
 *
 * 점수 구성:
 * - AI 기본 검사 (50점): 길이, 치과 콘텐츠, 얼굴 없음, 중복 없음, 정지화면 없음
 * - 커뮤니티 반응 (50점): 시청 완료율, 좋아요율, 댓글 활성도
 *   → 커뮤니티 점수는 업로드 48시간 후 별도 업데이트
 */

import * as admin from 'firebase-admin';
import type { QualityCheckResult } from './qualityTypes';

const db = admin.firestore();

/* ─────────────────────────────────────
   커뮤니티 반응 점수 업데이트 (48h 후)
───────────────────────────────────── */

export async function updateCommunityScore(caseId: string): Promise<number> {
  const caseSnap = await db.collection('cases').doc(caseId).get();
  if (!caseSnap.exists()) return 0;

  const caseData = caseSnap.data()!;
  const views    = caseData.views   ?? 0;
  const likes    = (caseData.likes  ?? []).length;

  // 시청 완료율 (별도 트래킹 필드)
  const completions = caseData.completions ?? 0;
  const completionRate = views > 0 ? completions / views : 0;

  // 좋아요율
  const likeRate = views > 0 ? likes / views : 0;

  // 커뮤니티 점수 산정 (최대 50점)
  let communityScore = 0;
  communityScore += Math.min(30, Math.round(completionRate * 30)); // 완료율 최대 30점
  communityScore += Math.min(15, Math.round(likeRate * 150));      // 좋아요율 최대 15점
  communityScore += views >= 10 ? 5 : Math.round(views / 2);      // 조회수 최대 5점

  // quality_checks 문서 업데이트
  const qualitySnap = await db.collection('quality_checks').doc(caseId).get();
  if (!qualitySnap.exists()) return communityScore;

  const existing = qualitySnap.data()!;
  const aiScore  = existing.score ?? 0;
  const totalScore = Math.min(100, aiScore + communityScore);

  await db.collection('quality_checks').doc(caseId).update({
    communityScore,
    completionRate,
    totalScore,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return totalScore;
}

/* ─────────────────────────────────────
   보상 금액 계산
───────────────────────────────────── */

export interface RewardCalculation {
  baseReward:    number;  // 기본 보상 (10 RAB)
  qualityBonus:  number;  // 품질 보너스 (0~20 RAB)
  totalReward:   number;
  tier:          'gold' | 'silver' | 'bronze' | 'none';
}

export function calculateReward(totalScore: number): RewardCalculation {
  const BASE    = 10;
  const MAX_BONUS = 20;

  // 점수 구간별 보너스
  let qualityBonus = 0;
  let tier: RewardCalculation['tier'] = 'none';

  if (totalScore >= 85) {
    qualityBonus = MAX_BONUS;         // 20 RAB 보너스
    tier = 'gold';
  } else if (totalScore >= 70) {
    qualityBonus = Math.round(MAX_BONUS * 0.7);  // 14 RAB
    tier = 'silver';
  } else if (totalScore >= 50) {
    qualityBonus = Math.round(MAX_BONUS * 0.3);  // 6 RAB
    tier = 'bronze';
  } else {
    qualityBonus = 0;
    tier = 'none';
  }

  return {
    baseReward:   BASE,
    qualityBonus,
    totalReward:  BASE + qualityBonus,
    tier,
  };
}

/* ─────────────────────────────────────
   신고 누적 처리
───────────────────────────────────── */

export async function handleReport(
  caseId: string,
  reporterUserId: string,
  reason: string
): Promise<{ autoHidden: boolean; flagCount: number }> {
  const AUTO_HIDE_THRESHOLD = 3;

  const caseRef = db.collection('cases').doc(caseId);
  const reportRef = db.collection('case_reports').doc();

  let autoHidden = false;
  let flagCount  = 0;

  await db.runTransaction(async tx => {
    const caseSnap = await tx.get(caseRef);
    if (!caseSnap.exists()) return;

    const caseData = caseSnap.data()!;
    flagCount = (caseData.reportCount ?? 0) + 1;

    // 신고 기록
    tx.set(reportRef, {
      caseId,
      reporterUserId,
      reason,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 케이스 신고 수 업데이트
    tx.update(caseRef, {
      reportCount: flagCount,
      // 임계값 초과 시 자동 비공개
      ...(flagCount >= AUTO_HIDE_THRESHOLD ? { visibility: '비공개', autoHidden: true } : {}),
    });

    if (flagCount >= AUTO_HIDE_THRESHOLD) autoHidden = true;

    // quality_checks 업데이트
    const qRef = db.collection('quality_checks').doc(caseId);
    tx.set(qRef, {
      communityFlags: flagCount,
      ...(autoHidden ? { verdict: 'fail', failReasons: admin.firestore.FieldValue.arrayUnion('신고 누적으로 자동 비공개') } : {}),
    }, { merge: true });
  });

  return { autoHidden, flagCount };
}
