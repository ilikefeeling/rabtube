/**
 * Firebase Admin SDK (서버 전용)
 * Webhook, API Routes에서 사용
 * 지연 초기화(lazy init)로 빌드 타임 오류 방지
 */

import * as admin from 'firebase-admin';

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
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
