import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const { passkey } = await request.json();
    
    // Check against environment variable or a fallback default passkey
    const validPasskey = process.env.ADMIN_PASSKEY || 'rabtube-admin-2024!';
    if (passkey !== validPasskey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = 'ilikefeeling@gmail.com';
    const auth = getAdminAuth();
    const db = getAdminDb();
    let uid = '';
    
    try {
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        // Create the admin user in Firebase Auth if it doesn't exist
        const newUser = await auth.createUser({
          email,
          emailVerified: true,
          displayName: '최고관리자',
        });
        uid = newUser.uid;
      } else {
        throw e;
      }
    }

    // Ensure the user has the correct admin role and status in Firestore
    await db.collection('users').doc(uid).set({
      uid,
      email,
      name: '최고관리자',
      role: 'admin',
      status: 'approved',
      // only set createdAt if it doesn't exist
    }, { merge: true });

    // Generate a custom token for the admin user
    const customToken = await auth.createCustomToken(uid);
    return NextResponse.json({ token: customToken });
    
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
