/**
 * Firebase Admin SDK (서버 전용)
 * Webhook, API Routes에서 사용
 * 지연 초기화(lazy init)로 빌드 타임 오류 방지
 */

import * as admin from 'firebase-admin';

export function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }
  
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    // Parse private key: handle quotes, JSON encoding, and escaped newlines
    let parsedKey = privateKey;
    
    // Debug: log the first/last 30 chars to understand the format (no sensitive data)
    console.log('PRIVATE_KEY debug - length:', parsedKey.length);
    console.log('PRIVATE_KEY debug - first 40 chars:', JSON.stringify(parsedKey.substring(0, 40)));
    console.log('PRIVATE_KEY debug - last 40 chars:', JSON.stringify(parsedKey.substring(parsedKey.length - 40)));
    
    // If the entire value is JSON-encoded (wrapped in quotes), parse it
    if (parsedKey.startsWith('"') && parsedKey.endsWith('"')) {
      try {
        parsedKey = JSON.parse(parsedKey);
      } catch {
        // If JSON.parse fails, just strip the quotes manually
        parsedKey = parsedKey.slice(1, -1);
      }
    }
    
    // Replace literal \n with actual newlines
    parsedKey = parsedKey.replace(/\\n/g, '\n');
    
    console.log('PRIVATE_KEY debug - starts with BEGIN:', parsedKey.startsWith('-----BEGIN'));
    console.log('PRIVATE_KEY debug - contains real newlines:', parsedKey.includes('\n'));
    
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: parsedKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  // Fallback: initialize with just projectId to prevent crash when keys are missing
  return admin.initializeApp({
    projectId: projectId || 'rabtube-b4444',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export function getAdminDb()      { return getAdminApp().firestore(); }
export function getAdminStorage() { return getAdminApp().storage(); }
export function getAdminAuth()    { return getAdminApp().auth(); }

// 하위 호환성을 위한 named exports (런타임에만 호출되는 파일에서 사용)
export const adminDb      = new Proxy({} as admin.firestore.Firestore,    { get: (_, p) => (getAdminDb()      as any)[p] });
export const adminStorage = new Proxy({} as admin.storage.Storage,        { get: (_, p) => (getAdminStorage() as any)[p] });
export const adminAuth    = new Proxy({} as admin.auth.Auth,              { get: (_, p) => (getAdminAuth()    as any)[p] });

export default admin;
