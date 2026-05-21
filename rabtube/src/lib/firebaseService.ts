import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, limit, increment,
  arrayUnion, arrayRemove, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
} from 'firebase/storage';
import { db, storage } from './firebase';
import { awardUploadReward, awardLikeReward } from './pointService';
import type { CaseVideo, UserProfile, UploadProgress } from '@/types';

/* ── Firestore collections ── */
export const COLLECTIONS = {
  USERS: 'users',
  CASES: 'cases',
} as const;

/* ─────────────── USER ─────────────── */

export async function createUserProfile(
  uid: string,
  data: Omit<UserProfile, 'uid' | 'createdAt' | 'status' | 'role'>
) {
  await doc(db, COLLECTIONS.USERS, uid);
  const ref = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(ref, {
    ...data,
    uid,
    status: 'approved', // MVP: 자동 승인 (추후 관리자 승인으로 전환)
    role: 'user',
    createdAt: serverTimestamp(),
  }).catch(async () => {
    // doc이 없으면 setDoc으로 생성
    const { setDoc } = await import('firebase/firestore');
    await setDoc(ref, {
      ...data,
      uid,
      status: 'approved',
      role: 'user',
      createdAt: serverTimestamp(),
    });
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    ...d,
    createdAt: (d.createdAt as Timestamp)?.toDate() ?? new Date(),
  } as UserProfile;
}

/* ─────────────── CASES ─────────────── */

export async function getCases(category?: string): Promise<CaseVideo[]> {
  let q = query(
    collection(db, COLLECTIONS.CASES),
    where('visibility', '!=', '비공개'),
    orderBy('visibility'),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  if (category && category !== '전체') {
    q = query(
      collection(db, COLLECTIONS.CASES),
      where('category', '==', category),
      where('visibility', '!=', '비공개'),
      orderBy('visibility'),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => docToCase(d));
}

export async function getCaseById(id: string): Promise<CaseVideo | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.CASES, id));
  if (!snap.exists()) return null;
  return docToCase(snap);
}

export async function getMyCases(userId: string): Promise<CaseVideo[]> {
  const q = query(
    collection(db, COLLECTIONS.CASES),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => docToCase(d));
}

export async function incrementViews(caseId: string) {
  await updateDoc(doc(db, COLLECTIONS.CASES, caseId), {
    views: increment(1),
  });
}

export async function toggleLike(
  caseId: string,
  userId: string,
  isLiked: boolean,
  uploaderUserId?: string
) {
  await updateDoc(doc(db, COLLECTIONS.CASES, caseId), {
    likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
  });
  // 좋아요 추가 시 업로더에게 보상 (본인 케이스 제외)
  if (!isLiked && uploaderUserId && uploaderUserId !== userId) {
    awardLikeReward(uploaderUserId, userId, caseId).catch(console.error);
  }
}

/* ─────────────── UPLOAD ─────────────── */

export function uploadCaseVideo(
  file: File,
  userId: string,
  metadata: Omit<CaseVideo, 'id' | 'userId' | 'userProfile' | 'videoUrl' | 'thumbnailUrl' | 'duration' | 'views' | 'likes' | 'createdAt' | 'updatedAt'>,
  userProfile: UserProfile,
  onProgress: (p: UploadProgress) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop();
    const path = `videos/${userId}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    task.on(
      'state_changed',
      snapshot => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress({ phase: 'uploading', percent: pct });
      },
      error => {
        onProgress({ phase: 'error', percent: 0, error: error.message });
        reject(error);
      },
      async () => {
        onProgress({ phase: 'processing', percent: 100 });
        const videoUrl = await getDownloadURL(task.snapshot.ref);

        const docRef = await addDoc(collection(db, COLLECTIONS.CASES), {
          userId,
          userProfile: {
            name: userProfile.name,
            hospital: userProfile.hospital,
            region: userProfile.region,
          },
          ...metadata,
          videoUrl,
          thumbnailUrl: '',
          duration: 0,
          views: 0,
          likes: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // 업로드 보상 지급 (48h pending)
        const userCreatedAt = userProfile.createdAt instanceof Date
          ? userProfile.createdAt
          : new Date();
        awardUploadReward(userId, docRef.id, userCreatedAt).catch(console.error);

        onProgress({ phase: 'done', percent: 100 });
        resolve(docRef.id);
      }
    );
  });
}

export async function deleteCaseVideo(caseId: string, videoUrl: string) {
  await updateDoc(doc(db, COLLECTIONS.CASES, caseId), { visibility: '비공개' });
  try {
    const storageRef = ref(storage, videoUrl);
    await deleteObject(storageRef);
  } catch (_) {}
}

/* ───────────────── LICENSE ───────────────── */

export function uploadLicenseFile(
  file: File,
  userId: string,
  onProgress: (p: UploadProgress) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop();
    const path = `licenses/${userId}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

    task.on(
      'state_changed',
      snapshot => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress({ phase: 'uploading', percent: pct });
      },
      error => {
        onProgress({ phase: 'error', percent: 0, error: error.message });
        reject(error);
      },
      async () => {
        onProgress({ phase: 'processing', percent: 100 });
        const url = await getDownloadURL(task.snapshot.ref);
        onProgress({ phase: 'done', percent: 100 });
        resolve(url);
      }
    );
  });
}

export async function submitLicenseForReview(userId: string, licenseUrl: string) {
  const { serverTimestamp: st } = await import('firebase/firestore');
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(userRef, {
    licenseUrl,
    status: 'pending',
    licenseSubmittedAt: st(),
    rejectionReason: '',
  });
}

/* ── helper ── */
function docToCase(snap: any): CaseVideo {
  const d = snap.data();
  return {
    ...d,
    id: snap.id,
    createdAt: (d.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (d.updatedAt as Timestamp)?.toDate() ?? new Date(),
  } as CaseVideo;
}
