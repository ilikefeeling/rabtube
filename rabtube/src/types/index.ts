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
export type UserStatus = 'pending' | 'approved' | 'rejected';

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
  licenseUrl?: string;
  licenseSubmittedAt?: Date;
  rejectionReason?: string;
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
}

export interface UploadProgress {
  phase: 'idle' | 'uploading' | 'processing' | 'done' | 'error';
  percent: number;
  error?: string;
}

/* ── Case Step (타임라인 에디터) ── */

export type StepType = 'cause' | 'process' | 'result';

export interface CaseStepDraft {
  id: string;
  type: StepType;
  label: string;
  description: string;
  files: File[];
  previews: string[];
  order: number;
}

export const MAX_IMAGES_PER_STEP = 5;

// Firestore에 저장된 읽기 전용 타입
export interface CaseStep {
  id: string;
  type: StepType;
  label: string;
  description: string;
  imageUrls: string[];
  order: number;
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

/* ── Stripe 구독 결제 ── */

export type SubscriptionTier = 'free' | 'pro' | 'clinic';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface Subscription {
  userId:             string;
  tier:               SubscriptionTier;
  status:             SubscriptionStatus;
  stripeCustomerId:   string;
  stripeSubId:        string;
  currentPeriodStart: Date;
  currentPeriodEnd:   Date;
  cancelAtPeriodEnd:  boolean;
  createdAt:          Date;
  updatedAt:          Date;
}

export interface PaymentRecord {
  id:               string;
  userId:           string;
  type:             'subscription' | 'rab_purchase' | 'rab_cashout';
  status:           PaymentStatus;
  amountKrw:        number;   // 원화 금액
  amountRab:        number;   // RAB 금액 (환전 시)
  stripePaymentId?: string;
  description:      string;
  createdAt:        Date;
}

export interface RabCashoutRequest {
  id:         string;
  userId:     string;
  rabAmount:  number;   // 신청 RAB
  krwAmount:  number;   // 환전 원화
  status:     'pending' | 'processing' | 'completed' | 'rejected';
  bankName:   string;
  accountNo:  string;
  accountHolder: string;
  rejectedReason?: string;
  createdAt:  Date;
  processedAt?: Date;
}

export const SUBSCRIPTION_PLANS = {
  free: {
    name: '스타터',
    priceKrw: 0,
    priceRab: 0,
    uploadPerMonth: 5,
    features: ['가입 보너스 50 RAB', '월 5건 업로드', '전체 케이스 시청', '기본 검색'],
  },
  pro: {
    name: '프로',
    priceKrw: 29000,
    priceRab: 200,
    uploadPerMonth: 50,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '',
    features: ['월 50건 업로드', '무제한 시청', '프리미엄 케이스', '다운로드', '홍보 부스트'],
  },
  clinic: {
    name: '클리닉',
    priceKrw: 79000,
    priceRab: 600,
    uploadPerMonth: 999,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_CLINIC_PRICE_ID ?? '',
    features: ['무제한 업로드', '무제한 시청', '5인 서브계정', '무제한 다운로드', '분석 대시보드'],
  },
} as const;

export const RAB_EXCHANGE = {
  krwPerRab:       10,     // 1 RAB = 10원 (Phase 2 기준)
  minCashoutRab:   1000,   // 최소 환전 1,000 RAB
  cashoutFeeRate:  0.05,   // 환전 수수료 5%
  rabPerKrw1000:   90,     // ₩1,000 → 90 RAB (10% 보너스)
} as const;

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
