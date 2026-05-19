# 🦷 RabTube — 치과 개원의 케이스 플랫폼

치과 개원의를 위한 케이스 영상 전문 커뮤니티

## 기술 스택

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Auth**: Firebase Authentication (Email/Password)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage (영상 파일)
- **Deployment**: Vercel

---

## ⚡ 빠른 시작

### 1. Firebase 프로젝트 생성

1. https://console.firebase.google.com 접속
2. "프로젝트 추가" → 프로젝트명 `rabtube` 입력
3. **Authentication** 활성화
   - 로그인 방법 → 이메일/비밀번호 사용 설정
4. **Firestore Database** 생성
   - 프로덕션 모드로 시작
   - 지역: `asia-northeast3` (서울)
5. **Storage** 활성화
   - 기본 규칙으로 시작
6. 웹 앱 등록 → Firebase SDK 설정 값 복사

### 2. 환경 변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 파일에 Firebase 설정 값 입력

### 3. 보안 규칙 배포

```bash
npm install -g firebase-tools
firebase login
firebase init  # Firestore, Storage 선택
firebase deploy --only firestore:rules,storage:rules
```

### 4. 의존성 설치 및 실행

```bash
npm install
npm run dev
```

### 5. Vercel 배포

```bash
npm install -g vercel
vercel --prod
```
Vercel 환경 변수에 `.env.local` 내용 동일하게 추가

---

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx              # 메인 피드
│   ├── upload/page.tsx       # 케이스 업로드
│   ├── my/page.tsx           # 내 케이스 관리
│   └── auth/
│       ├── login/page.tsx    # 로그인
│       └── register/page.tsx # 회원가입
├── components/
│   ├── Header.tsx            # 상단 헤더
│   ├── VideoCard.tsx         # 케이스 카드
│   └── VideoPlayer.tsx       # 영상 재생 모달
├── lib/
│   ├── firebase.ts           # Firebase 초기화
│   ├── firebaseService.ts    # Firestore/Storage 함수
│   └── AuthContext.tsx       # 인증 컨텍스트
└── types/
    └── index.ts              # TypeScript 타입 정의
```

---

## 🗄️ Firestore 인덱스 (필요 시 추가)

Firebase Console → Firestore → 인덱스 탭에서 아래 복합 인덱스 추가:

| 컬렉션 | 필드 1 | 필드 2 | 필드 3 |
|--------|--------|--------|--------|
| cases | visibility (ASC) | createdAt (DESC) | |
| cases | category (ASC) | visibility (ASC) | createdAt (DESC) |
| cases | userId (ASC) | createdAt (DESC) | |

---

## 🚀 Phase 2 개발 예정

- [ ] Cloud Functions: 영상 업로드 후 썸네일 자동 생성
- [ ] 댓글 / 좋아요 실시간 업데이트
- [ ] 회원 관리자 승인 시스템
- [ ] 구독 결제 (Stripe)
- [ ] 케이스 검색 (Algolia)
- [ ] 모바일 최적화
