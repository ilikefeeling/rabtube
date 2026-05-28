import { config } from 'dotenv';
import * as admin from 'firebase-admin';

// Load .env.local
config({ path: '.env.local' });

async function createTestUser() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase Admin credentials in .env.local');
    return;
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });

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
    process.exit(0);
  }
}

createTestUser();
