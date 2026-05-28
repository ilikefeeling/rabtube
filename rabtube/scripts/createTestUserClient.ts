import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, setDoc, doc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

import { config } from 'dotenv';
config({ path: '.env.local' });

async function createTestUser() {
  const app = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });

  const auth = getAuth(app);
  const db = getFirestore(app);

  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'password123!';
  
  try {
    console.log(`Creating test user (Client SDK): ${testEmail}...`);
    // 1. Create Auth User
    const cred = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('Auth user created:', cred.user.uid);

    // 2. Create Firestore Document (Intentionally omitting status field)
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      email: testEmail,
      name: '새로고침 테스트유저 (Client)',
      hospital: 'RabTube 테스트용 가짜병원',
      createdAt: serverTimestamp(),
    });

    console.log('Firestore document created successfully!');
    console.log(`✅ SUCCESS! Please log in as Admin on the actual site and check the Admin Panel.`);
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    process.exit(0);
  }
}

createTestUser();
