export type CaseCategory =
  | '임플란트'
  | '보철'
  | '치주'
  | '교정'
  | '보존'
  | '소아'
  | '구강외과';

export type Visibility = '회원전용' | '비공개' | '전체공개';
export type Difficulty = '초급' | '중급' | '고급';

/* ═══════════════════════════════════════════
   치료 타임라인 단계 (Case Step)
   ═══════════════════════════════════════════ */

/** 치료 단계 유형: cause(원인/초진) → process(치료 과정) → result(결과) */
export type StepType = 'cause' | 'process' | 'result';

/** 단계당 최대 사진 수 */
export const MAX_IMAGES_PER_STEP = 5;
/** 전체 케이스 최대 사진 수 */
export const MAX_IMAGES_TOTAL = 30;

/** 케이스 치료 단계 하나 (사진 + 설명) */
export interface CaseStep {
  id: string;              // 클라이언트 생성 고유 ID
  type: StepType;          // 'cause' | 'process' | 'result'
  label: string;           // 단계 이름 (예: "발치", "골이식", "보철물 장착")
  description: string;     // 단계 설명
  imageUrls: string[];     // Firebase Storage 업로드 완료된 URL 배열
  order: number;           // 정렬 순서 (0-based)
}

/** 업로드 폼에서 사용하는 로컬 단계 (아직 업로드 안 된 File 객체 포함) */
export interface CaseStepDraft {
  id: string;
  type: StepType;
  label: string;
  description: string;
  files: File[];           // 아직 업로드 전인 로컬 File 객체
  previews: string[];      // URL.createObjectURL로 생성한 미리보기 URL
  order: number;
}

/* ═══════════════════════════════════════════
   회원 상태 (선가입-후승인 전략)
   ═══════════════════════════════════════════ */

/**
 * - ASSOCIATE: 준회원 (면허 서류 미제출)
 * - PENDING:   검토대기 (면허 서류 제출 완료, 관리자 검토 중)
 * - APPROVED:  정회원 (관리자 승인 완료)
 * - REJECTED:  반려 (관리자 반려, 재제출 가능)
 *
 * 하위호환: 기존 'approved' 상태 유저도 정회원으로 처리
 */
export type UserStatus = 'ASSOCIATE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'approved' | 'pending' | 'rejected';

/** 정회원 여부를 판별하는 헬퍼 (하위호환 포함) */
export function isApprovedStatus(status: UserStatus | string | undefined): boolean {
  return status === 'APPROVED' || status === 'approved';
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  hospital: string;
  region: string;
  licenseNumber: string;
  status: UserStatus;
  role: 'user' | 'admin';
  createdAt: Date;
  avatarUrl?: string;

  // ── 본인인증 정보 (PASS/카카오 연동 시 자동 주입) ──
  birthdate?: string;         // YYYYMMDD
  phone?: string;             // 01012345678
  ciValue?: string;           // 고유식별값 (unique, 중복가입 방지)
  verifiedName?: string;      // 본인인증으로 확인된 실명

  // ── 면허 서류 정보 ──
  licenseFileUrl?: string;    // Firebase Storage 경로
  licenseSubmittedAt?: Date;  // 서류 제출 일시
  reviewedAt?: Date;          // 관리자 검토 일시
  rejectionReason?: string;   // 반려 사유
}

export interface CaseVideo {
  id: string;
  userId: string;
  userProfile: {
    name: string;
    hospital: string;
    region: string;
  };
  title: string;
  description: string;
  category: CaseCategory;
  toothNumber: string;
  tags: string[];
  difficulty: Difficulty;
  visibility: Visibility;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // seconds
  views: number;
  likes: string[]; // array of userIds
  createdAt: Date;
  updatedAt: Date;

  // ── 치료 타임라인 (선택, 하위호환: 기존 영상만 케이스는 undefined) ──
  steps?: CaseStep[];
}

export interface UploadProgress {
  phase: 'idle' | 'uploading' | 'processing' | 'done' | 'error';
  percent: number;
  error?: string;
}

/* ── RAB Point System ── */

export type PointTxType =
  | 'SIGNUP_BONUS'        // 회원가입 보너스
  | 'UPLOAD_REWARD'       // 케이스 업로드 보상
  | 'UPLOAD_QUALITY_BONUS'// 품질 점수 보너스
  | 'LIKE_RECEIVED'       // 좋아요 수신 보상
  | 'VIEW_SHARE'          // 시청료 배분 (업로더)
  | 'VIEW_SPEND'          // 시청 소비
  | 'DOWNLOAD_SPEND'      // 다운로드 소비
  | 'BOOST_SPEND'         // 홍보 부스트 소비
  | 'ADMIN_GRANT'         // 관리자 지급
  | 'ADMIN_DEDUCT'        // 관리자 차감
  | 'REPORT_REWARD'       // 신고 보상
  | 'PENALTY_DEDUCT';     // 불량 업로드 패널티

export type PointTxStatus = 'pending' | 'confirmed' | 'cancelled';

export interface PointTransaction {
  id: string;
  userId: string;
  type: PointTxType;
  amount: number;           // 양수: 획득, 음수: 소비
  balanceAfter: number;     // 트랜잭션 후 잔액
  status: PointTxStatus;
  description: string;
  relatedCaseId?: string;   // 관련 케이스 ID
  relatedUserId?: string;   // 관련 유저 ID (예: 좋아요 누른 사람)
  confirmedAt?: Date;       // pending → confirmed 시각 (업로드: +48h)
  createdAt: Date;
}

export interface PointBalance {
  userId: string;
  balance: number;          // 확정 잔액
  pendingBalance: number;   // 보류 중 잔액 (48h 대기)
  totalEarned: number;      // 누적 획득
  totalSpent: number;       // 누적 소비
  updatedAt: Date;
}

// RAB 포인트 정책 상수
export const RAB_POLICY = {
  SIGNUP_BONUS: 50,
  UPLOAD_BASE: 10,
  UPLOAD_QUALITY_MAX: 20,   // 품질 점수 보너스 최대
  LIKE_REWARD: 1,
  VIEW_COST: 5,
  VIEW_UPLOADER_SHARE: 0.7, // 업로더 70%
  VIEW_PLATFORM_SHARE: 0.2, // 플랫폼 20%
  VIEW_BURN: 0.1,           // 소각 10%
  DOWNLOAD_COST: 10,
  BOOST_COST: 50,
  UPLOAD_PENDING_HOURS: 48, // 업로드 보상 보류 시간
  MONTHLY_UPLOAD_CAP: 10,   // 월 업로드 보상 상한 건수
  NEW_USER_MONTHS: 3,       // 신규 회원 기간 (절반 지급)
  NEW_USER_RATE: 0.5,       // 신규 회원 보상 비율
} as const;

