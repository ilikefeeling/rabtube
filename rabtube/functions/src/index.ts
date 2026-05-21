/**
 * RabTube Cloud Functions — 전체 진입점
 *
 * Triggers:
 * 1. onVideoUploaded       Storage trigger → 품질 검수 + 썸네일 생성
 * 2. onCaseCreated         Firestore trigger → 업로드 보상 지급
 * 3. onReportCreated       Firestore trigger → 신고 처리
 * 4. confirmPendingRewards Scheduled (매시간) → pending 보상 확정
 * 5. updateCommunityScores Scheduled (매일 새벽 2시) → 커뮤니티 점수 갱신
 * 6. onAdminQualityOverride HTTP callable → 관리자 수동 판정
 */

import * as functions from 'firebase-functions';
import * as admin     from 'firebase-admin';
import { runQualityCheck }             from './aiQualityChecker';
import { updateCommunityScore, handleReport, calculateReward } from './qualityScorer';
import { generateThumbnail, getVideoDuration } from './thumbnailGenerator';
import {
  issueUploadReward,
  issueQualityBonus,
  applyPenalty,
  confirmDuePending,
} from './rabRewardDistributor';

admin.initializeApp();
const db = admin.firestore();

/* ══════════════════════════════════════════
   1. Storage Trigger: 영상 업로드 감지
   → 품질 검수 파이프라인 실행
══════════════════════════════════════════ */

export const onVideoUploaded = functions
  .runWith({ timeoutSeconds: 540, memory: '2GB' })
  .storage.object()
  .onFinalize(async (object) => {
    const filePath    = object.name ?? '';
    const contentType = object.contentType ?? '';

    // videos/ 경로의 영상 파일만 처리
    if (!filePath.startsWith('videos/') || !contentType.startsWith('video/')) return;

    // caseId 추출 (Storage 메타데이터에 저장)
    const caseId = object.metadata?.caseId;
    if (!caseId) {
      console.warn(`[QualityCheck] caseId not found in metadata: ${filePath}`);
      return;
    }

    console.log(`[QualityCheck] Starting pipeline for caseId=${caseId}`);

    try {
      // ① 영상 길이 추출 → Firestore 저장
      const duration = await getVideoDuration(filePath);
      await db.collection('cases').doc(caseId).update({ duration });

      // ② 썸네일 생성 (비동기 병렬)
      const [thumbUrl, qualityResult] = await Promise.allSettled([
        generateThumbnail(filePath, caseId),
        runQualityCheck(caseId, filePath, object.metadata?.userId ?? ''),
      ]);

      const quality = qualityResult.status === 'fulfilled' ? qualityResult.value : null;

      // ③ 케이스 상태 업데이트
      const verdict = quality?.verdict ?? 'review';
      await db.collection('cases').doc(caseId).update({
        qualityVerdict:  verdict,
        qualityScore:    quality?.score ?? 0,
        qualityCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(verdict === 'fail' ? { visibility: '비공개' } : {}),
      });

      // ④ 판정 결과별 처리
      if (verdict === 'fail') {
        console.log(`[QualityCheck] FAIL caseId=${caseId}: ${quality?.failReasons.join(', ')}`);
        // 패널티 없음 (fail 첫 건) — 경고만
      } else {
        console.log(`[QualityCheck] PASS/REVIEW caseId=${caseId}, score=${quality?.score}`);
      }

    } catch (err) {
      console.error(`[QualityCheck] Pipeline error caseId=${caseId}:`, err);
    }
  });

/* ══════════════════════════════════════════
   2. Firestore Trigger: cases 문서 생성
   → 업로드 보상 지급 (48h pending)
══════════════════════════════════════════ */

export const onCaseCreated = functions
  .firestore.document('cases/{caseId}')
  .onCreate(async (snap, context) => {
    const caseId   = context.params.caseId;
    const caseData = snap.data();
    const userId   = caseData.userId;
    if (!userId) return;

    // 업로더 정보 조회
    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists()) return;
    const userData = userSnap.data()!;

    const createdAt = userData.createdAt as admin.firestore.Timestamp
      ?? admin.firestore.Timestamp.now();

    const result = await issueUploadReward(userId, caseId, createdAt);
    console.log(`[UploadReward] userId=${userId} caseId=${caseId}`, result);
  });

/* ══════════════════════════════════════════
   3. Firestore Trigger: quality_checks 업데이트
   → 품질 결과 확정 시 보너스 지급
══════════════════════════════════════════ */

export const onQualityChecked = functions
  .firestore.document('quality_checks/{caseId}')
  .onWrite(async (change, context) => {
    const caseId  = context.params.caseId;
    const after   = change.after.data();
    const before  = change.before.data();
    if (!after) return;

    const verdictChanged =
      (!before || before.verdict !== after.verdict);

    if (!verdictChanged) return;

    const verdict = after.verdict as string;
    const score   = after.score ?? 0;

    // 케이스 소유자 조회
    const caseSnap = await db.collection('cases').doc(caseId).get();
    if (!caseSnap.exists()) return;
    const userId = caseSnap.data()!.userId;

    if (verdict === 'pass' && score > 0) {
      // 품질 보너스 지급
      await issueQualityBonus(userId, caseId, score);
      const reward = calculateReward(score);
      console.log(`[QualityBonus] userId=${userId} score=${score} tier=${reward.tier} bonus=${reward.qualityBonus}`);
    } else if (verdict === 'fail') {
      const failReasons = (after.failReasons ?? []).join(', ');
      await applyPenalty(userId, caseId, failReasons);
      console.log(`[Penalty] userId=${userId} caseId=${caseId} reasons=${failReasons}`);
    }
  });

/* ══════════════════════════════════════════
   4. Firestore Trigger: 신고 접수
══════════════════════════════════════════ */

export const onReportCreated = functions
  .firestore.document('case_reports/{reportId}')
  .onCreate(async (snap, context) => {
    const data          = snap.data();
    const caseId        = data.caseId;
    const reporterUserId = data.reporterUserId;
    const reason        = data.reason ?? '사유 없음';

    const result = await handleReport(caseId, reporterUserId, reason);
    console.log(`[Report] caseId=${caseId} flags=${result.flagCount} autoHidden=${result.autoHidden}`);

    if (result.autoHidden) {
      // 케이스 업로더에게 패널티
      const caseSnap = await db.collection('cases').doc(caseId).get();
      if (caseSnap.exists()) {
        const userId = caseSnap.data()!.userId;
        await applyPenalty(userId, caseId, '신고 누적 자동 비공개');
      }
    }
  });

/* ══════════════════════════════════════════
   5. Scheduled: 매 시간 — Pending 보상 확정
══════════════════════════════════════════ */

export const confirmPendingRewards = functions
  .pubsub.schedule('every 60 minutes')
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    const count = await confirmDuePending();
    console.log(`[ConfirmPending] ${count}건 확정 완료`);
  });

/* ══════════════════════════════════════════
   6. Scheduled: 매일 새벽 2시 — 커뮤니티 점수 갱신
      (업로드 후 48시간 경과한 케이스 대상)
══════════════════════════════════════════ */

export const updateCommunityScores = functions
  .pubsub.schedule('0 2 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000);
    const threeDaysAgo = new Date(Date.now() - 72 * 3600 * 1000);

    const snap = await db.collection('cases')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(threeDaysAgo))
      .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(twoDaysAgo))
      .where('qualityVerdict', 'in', ['pass', 'review'])
      .get();

    let updated = 0;
    for (const doc of snap.docs) {
      try {
        const totalScore = await updateCommunityScore(doc.id);
        // 커뮤니티 점수 반영 후 보너스 추가 지급
        if (totalScore >= 70) {
          const caseData = doc.data();
          await issueQualityBonus(caseData.userId, doc.id, totalScore);
        }
        updated++;
      } catch (e) { console.error(e); }
    }
    console.log(`[CommunityScore] ${updated}건 업데이트 완료`);
  });

/* ══════════════════════════════════════════
   7. HTTP Callable: 관리자 수동 판정
══════════════════════════════════════════ */

export const adminOverrideQuality = functions.https.onCall(
  async (data: { caseId: string; verdict: 'pass' | 'fail'; reason: string }, context) => {
    // 인증 확인
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', '로그인 필요');

    const callerSnap = await db.collection('users').doc(context.auth.uid).get();
    if (!callerSnap.exists() || callerSnap.data()!.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', '관리자 권한 필요');
    }

    const { caseId, verdict, reason } = data;
    if (!caseId || !verdict) throw new functions.https.HttpsError('invalid-argument', '파라미터 누락');

    // quality_checks 업데이트
    await db.collection('quality_checks').doc(caseId).set({
      verdict,
      failReasons: verdict === 'fail' ? [reason] : [],
      adminOverride: true,
      adminId: context.auth.uid,
      overriddenAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // 케이스 가시성 업데이트
    await db.collection('cases').doc(caseId).update({
      qualityVerdict: verdict,
      ...(verdict === 'fail' ? { visibility: '비공개' } : { visibility: '회원전용' }),
    });

    console.log(`[AdminOverride] admin=${context.auth.uid} caseId=${caseId} verdict=${verdict}`);
    return { success: true };
  }
);
