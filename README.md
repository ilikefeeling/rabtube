# 🦷 RabTube v4 — 치과 개원의 케이스 플랫폼

치과 개원의를 위한 케이스 영상 전문 커뮤니티 + RAB 토큰 이코노미

---

## 기술 스택

| 레이어       | 기술                              |
|------------|----------------------------------|
| Frontend   | Next.js 14 + TypeScript + Tailwind |
| Auth       | Firebase Authentication           |
| Database   | Firebase Firestore                |
| Storage    | Firebase Storage                  |
| Functions  | Cloud Functions (Node 20)         |
| AI 검수     | Video Intelligence + Vision API   |
| 결제       | Stripe (구독 + 단건)              |
| 배포       | Vercel                            |

---

## 환경변수 설정

```bash
cp .env.local.example .env.local
# .env.local 파일에 모든 키 입력
```

**필수 키 6종:**
1. Firebase 클라이언트 6개
2. Firebase Admin SDK 3개 (서버 전용)
3. Stripe 5개 (결제/웹훅)
4. NEXT_PUBLIC_APP_URL

---

## 실행

```bash
npm install
npm run dev          # localhost:3000
```

---

## 배포

### Vercel
```bash
vercel --prod
# Vercel 대시보드 → Settings → Environment Variables 에 .env.local 내용 입력
```

### Firebase
```bash
npm install -g firebase-tools
firebase login
firebase init          # Firestore, Storage, Functions 선택
firebase deploy        # 전체 배포
```

---

## Stripe 설정

1. https://dashboard.stripe.com 에서 계정 생성
2. Products 탭에서 두 상품 생성:
   - **Pro**: ₩29,000/월 정기 구독
   - **Clinic**: ₩79,000/월 정기 구독
3. 각 Price ID를 `.env.local`에 입력
4. Webhook 설정: `https://rabtube.vercel.app/api/stripe/webhook`
   - 수신 이벤트: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

---

## Cloud Functions 배포

```bash
# Google Cloud APIs 활성화 (최초 1회)
gcloud services enable videointelligence.googleapis.com
gcloud services enable vision.googleapis.com

cd functions && npm install
firebase deploy --only functions
```

---

## 전체 페이지 구조

```
/                  메인 케이스 피드
/upload            케이스 업로드
/my                내 케이스 관리
/points            RAB 포인트 내역
/billing           구독 관리 + RAB 구매 + 환전 신청
/auth/login        로그인
/auth/register     회원가입
/admin             관리자 대시보드
/admin/cashout     환전 신청 처리 (관리자)
```

---

## API Routes

```
POST /api/stripe/checkout        Stripe 구독 결제 세션 생성
POST /api/stripe/rab-purchase    RAB 구매 세션 생성
POST /api/stripe/cancel          구독 취소 예약
POST /api/stripe/webhook         Stripe 이벤트 수신
POST /api/payments/cashout       RAB 환전 신청
POST /api/payments/rab-subscription RAB로 구독 결제
POST /api/admin/cashout-reject   환전 거절 + RAB 반환
```

---

## RAB 토큰 정책

| 이벤트          | RAB      |
|---------------|----------|
| 회원가입 보너스  | +50      |
| 업로드 (기본)   | +10~30   |
| 좋아요 수신     | +1       |
| 시청료 배분     | +3.5     |
| 케이스 시청     | -5       |
| 다운로드        | -10      |
| 홍보 부스트     | -50/주   |
| 환전 수수료     | 5%       |

---

## 개발 로드맵

- [x] MVP (영상 업로드/재생/인증)
- [x] RAB 포인트 시스템 (Firestore 트랜잭션)
- [x] 관리자 대시보드
- [x] AI 품질 검수 (Cloud Functions)
- [x] Stripe 구독 결제
- [x] RAB 구매 (단건 결제)
- [x] RAB → 현금 환전
- [x] 관리자 환전 처리 페이지
- [ ] Phase 3: 블록체인 토큰 전환 (Kaia/ERC-20)
- [ ] 거래소 상장
