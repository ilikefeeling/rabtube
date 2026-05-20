// 품질 검수 결과 타입

export type QualityVerdict = 'pass' | 'fail' | 'review';  // review = 사람 검토 필요

export interface QualityCheckResult {
  caseId:       string;
  verdict:      QualityVerdict;
  score:        number;          // 0~100
  failReasons:  string[];        // 실패 사유 목록
  aiChecks: {
    durationPass:   boolean;     // 최소 영상 길이
    isDentalContent:boolean;     // 치과 관련 콘텐츠 여부
    noFaceDetected: boolean;     // 환자 얼굴 미노출
    notDuplicate:   boolean;     // 중복 영상 아님
    notStaticFrame: boolean;     // 정지 화면 아님
  };
  communityFlags: number;        // 누적 신고 수
  completionRate: number;        // 시청 완료율 (사후)
  checkedAt:    Date;
}

export interface QualityPolicy {
  minDurationSec:    number;    // 최소 영상 길이 (초)
  autoFailFlags:     number;    // 자동 비공개 신고 누적 수
  pendingHours:      number;    // 보상 보류 시간
  completionRateGoodThreshold: number; // 고품질 완료율 기준
  monthlyUploadCap:  number;    // 월 업로드 보상 상한
}

export const DEFAULT_QUALITY_POLICY: QualityPolicy = {
  minDurationSec:    120,   // 2분
  autoFailFlags:     3,
  pendingHours:      48,
  completionRateGoodThreshold: 0.70,
  monthlyUploadCap:  10,
};
