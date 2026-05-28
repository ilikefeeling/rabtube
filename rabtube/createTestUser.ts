import * as admin from 'firebase-admin';

// 코드 설명: Next.js 자체 환경 변수 시스템을 이용하므로 
// 에러를 유발하던 외부 dotenv 패키지 의존성을 완전히 제거했습니다.

async function createTestUser() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase Admin credentials in Environment Variables');
    return;
  }

  // 💡 중복 초기화 방지 로직 추가 (안정성 강화)
  const app = admin.apps.length === 0
    ? admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    })
    : admin.app();

  const auth = app.auth();
  const db = app.firestore();

  const testEmail = `testuser_${Date.now()}@example.com`;

  try {
    console.log(`Creating test user: ${testEmail}...`);
    // 1. Create Auth User
    const userRecord = await auth.createUser({
      email: testEmail,
      password: 'password123!',
      displayName: '새로고침 테스트유저',
    });

    console.log('Auth user created:', userRecord.uid);

    // 2. Create Firestore Document WITHOUT 'status' field to test the bug fix!
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: testEmail,
      name: '새로고침 테스트유저',
      hospital: '테스트 병원',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      // Intentionally omitting status: 'pending' to verify the fix
    });

    console.log('Firestore document created successfully!');
    console.log('You can now check the Admin panel.');
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    // Vercel 환경 빌드 프로세스 유지를 위해 안전 종료 처리
    if (process.env.NODE_ENV !== 'production') {
      process.exit(0);
    }
  }
}

createTestUser();