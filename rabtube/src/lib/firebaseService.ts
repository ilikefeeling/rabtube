import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs, setDoc,
  query, where, orderBy, limit, increment,
  arrayUnion, arrayRemove, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
} from 'firebase/storage';
import { db, storage } from './firebase';
import { awardUploadReward, awardLikeReward } from './pointService';
import type { CaseVideo, CaseStep, CaseStepDraft, UserProfile, UploadProgress } from '@/types';

/* ── Firestore collections ── */
export const COLLECTIONS = {
  USERS: 'users',
  CASES: 'cases',
} as const;

/* ═══════════════════════════════════════════
   USER — 회원가입 / 프로필 / 면허 검증
   ═══════════════════════════════════════════ */

/**
 * 신규 회원 생성 (선가입-후승인: ASSOCIATE 상태)
 */
export async function createUserProfile(
  uid: string,
  data: Omit<UserProfile, 'uid' | 'createdAt' | 'status' | 'role'>
) {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  await setDoc(userRef, {
    ...data,
    uid,
    status: 'ASSOCIATE',   // 준회원 (면허 서류 미제출)
    role: 'user',
    createdAt: serverTimestamp(),
  });
}

/**
 * 관리자 회원 프로필 생성 (디버그/테스트용)
 */
export async function createAdminProfile(
  uid: string,
  data: Omit<UserProfile, 'uid' | 'createdAt' | 'status' | 'role'>
) {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  await setDoc(userRef, {
    ...data,
    uid,
    status: 'APPROVED',
    role: 'admin',
    createdAt: serverTimestamp(),
  });
}

/**
 * 유저 프로필 조회
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    ...d,
    createdAt: (d.createdAt as Timestamp)?.toDate() ?? new Date(),
    licenseSubmittedAt: (d.licenseSubmittedAt as Timestamp)?.toDate() ?? undefined,
    reviewedAt: (d.reviewedAt as Timestamp)?.toDate() ?? undefined,
  } as UserProfile;
}

/**
 * CI값 중복 검증 (본인인증 고유식별값 기반 중복가입 방지)
 */
export async function checkDuplicateCI(ciValue: string): Promise<boolean> {
  if (!ciValue) return false;
  const q = query(
    collection(db, COLLECTIONS.USERS),
    where('ciValue', '==', ciValue)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

/**
 * 면허증 파일을 Firebase Storage에 업로드
 */
export function uploadLicenseFile(
  file: File,
  userId: string,
  onProgress: (p: UploadProgress) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop();
    const path = `licenses/${userId}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    task.on(
      'state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress({ phase: 'uploading', percent: pct });
      },
      (error) => {
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

/**
 * 면허증 제출 → status를 PENDING으로 변경
 */
export async function submitLicenseForReview(
  userId: string,
  licenseFileUrl: string
) {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
    licenseFileUrl,
    status: 'PENDING',
    licenseSubmittedAt: serverTimestamp(),
  });
}

/**
 * 본인인증 이름 vs 프로필 이름 대조 (관리자 검증용)
 * true = 이름 일치, false = 불일치 (반려 사유)
 */
export function validateNameMatch(profile: UserProfile): boolean {
  if (!profile.verifiedName) return true; // 본인인증 미수행 시 스킵
  return profile.name.trim() === profile.verifiedName.trim();
}

/* ─── 관리자 전용 ─── */

/**
 * 검토 대기(PENDING) 회원 목록 조회
 */
export async function getAllPendingUsers(): Promise<UserProfile[]> {
  const q = query(
    collection(db, COLLECTIONS.USERS),
    where('status', '==', 'PENDING')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
      licenseSubmittedAt: (data.licenseSubmittedAt as Timestamp)?.toDate() ?? undefined,
      reviewedAt: (data.reviewedAt as Timestamp)?.toDate() ?? undefined,
    } as UserProfile;
  });
}

/**
 * 모든 회원 목록 조회 (관리자용)
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.USERS));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
      licenseSubmittedAt: (data.licenseSubmittedAt as Timestamp)?.toDate() ?? undefined,
      reviewedAt: (data.reviewedAt as Timestamp)?.toDate() ?? undefined,
    } as UserProfile;
  });
}

/**
 * 관리자 승인 → status를 APPROVED로
 */
export async function approveUser(userId: string) {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
    status: 'APPROVED',
    reviewedAt: serverTimestamp(),
    rejectionReason: '',
  });
}

/**
 * 관리자 반려 → status를 REJECTED로 + 사유 기록
 */
export async function rejectUser(userId: string, reason: string) {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
    status: 'REJECTED',
    reviewedAt: serverTimestamp(),
    rejectionReason: reason,
  });
}


/* ═══════════════════════════════════════════
   CASES — 케이스 영상 CRUD
   ═══════════════════════════════════════════ */

export async function getCases(category?: string): Promise<CaseVideo[]> {
  let q = query(
    collection(db, COLLECTIONS.CASES),
    where('visibility', '!=', '비공개')
  );
  if (category && category !== '전체') {
    q = query(
      collection(db, COLLECTIONS.CASES),
      where('category', '==', category),
      where('visibility', '!=', '비공개')
    );
  }
  const snap = await getDocs(q);
  const cases = snap.docs.map(d => docToCase(d));

  // Client-side sort by createdAt desc and slice to limit(30) to bypass composite index requirement
  return cases
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 30);
}

export async function getCaseById(id: string): Promise<CaseVideo | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.CASES, id));
  if (!snap.exists()) return null;
  return docToCase(snap);
}

export async function getMyCases(userId: string): Promise<CaseVideo[]> {
  const q = query(
    collection(db, COLLECTIONS.CASES),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const cases = snap.docs.map(d => docToCase(d));

  // Client-side sort by createdAt desc to bypass index requirement
  return cases.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
          thumbnailUrl: '',   // 추후 Cloud Function으로 자동 생성
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

/* ─────────────── STEP IMAGE UPLOAD ─────────────── */

/**
 * 단일 단계의 이미지들을 Firebase Storage에 업로드
 * @returns 업로드된 이미지 URL 배열
 */
async function uploadStepImages(
  files: File[],
  userId: string,
  stepId: string,
  onProgress?: (uploaded: number, total: number) => void
): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `cases/${userId}/steps/${stepId}/${Date.now()}_${i}.${ext}`;
    const storageRef = ref(storage, path);

    await new Promise<void>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file, { contentType: file.type });
      task.on(
        'state_changed',
        () => {},
        reject,
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          urls.push(url);
          onProgress?.(i + 1, files.length);
          resolve();
        }
      );
    });
  }
  return urls;
}

/**
 * 타임라인 케이스 전체 업로드 (단계 사진 + 선택 영상)
 *
 * 1) 각 단계의 사진을 순차 업로드
 * 2) (선택) 영상 파일 업로드
 * 3) Firestore 문서 생성
 */
export async function uploadCaseWithSteps(
  stepDrafts: CaseStepDraft[],
  videoFile: File | null,
  userId: string,
  metadata: {
    title: string;
    description: string;
    category: string;
    toothNumber: string;
    tags: string[];
    difficulty: string;
    visibility: string;
  },
  userProfile: UserProfile,
  onProgress: (p: UploadProgress & { detail?: string }) => void
): Promise<string> {
  try {
    onProgress({ phase: 'uploading', percent: 0, detail: '사진 업로드 준비 중...' });

    // ── 1) 단계별 사진 업로드 ──
    const totalFiles = stepDrafts.reduce((s, d) => s + d.files.length, 0) + (videoFile ? 1 : 0);
    let uploadedCount = 0;

    const steps: CaseStep[] = [];
    for (const draft of stepDrafts) {
      let imageUrls: string[] = [];

      if (draft.files.length > 0) {
        imageUrls = await uploadStepImages(
          draft.files,
          userId,
          draft.id,
          (done) => {
            uploadedCount++;
            const pct = Math.round((uploadedCount / Math.max(totalFiles, 1)) * 90);
            onProgress({
              phase: 'uploading',
              percent: Math.min(pct, 90),
              detail: `사진 업로드 중 (${uploadedCount}/${totalFiles})`,
            });
          }
        );
      }

      steps.push({
        id: draft.id,
        type: draft.type,
        label: draft.label,
        description: draft.description,
        imageUrls,
        order: draft.order,
      });
    }

    // ── 2) 영상 업로드 (선택) ──
    let videoUrl = '';
    if (videoFile) {
      onProgress({ phase: 'uploading', percent: 92, detail: '영상 업로드 중...' });
      const ext = videoFile.name.split('.').pop();
      const path = `videos/${userId}/${Date.now()}.${ext}`;
      const storageRef = ref(storage, path);

      videoUrl = await new Promise<string>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, videoFile, { contentType: videoFile.type });
        task.on('state_changed', () => {}, reject, async () => {
          resolve(await getDownloadURL(task.snapshot.ref));
        });
      });
    }

    // ── 3) Firestore 문서 생성 ──
    onProgress({ phase: 'processing', percent: 96, detail: '케이스 저장 중...' });

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
      steps: steps.map(s => ({
        id: s.id,
        type: s.type,
        label: s.label,
        description: s.description,
        imageUrls: s.imageUrls,
        order: s.order,
      })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 업로드 보상 지급 (48h pending)
    const userCreatedAt = userProfile.createdAt instanceof Date
      ? userProfile.createdAt
      : new Date();
    awardUploadReward(userId, docRef.id, userCreatedAt).catch(console.error);

    onProgress({ phase: 'done', percent: 100, detail: '업로드 완료!' });
    return docRef.id;
  } catch (err: any) {
    onProgress({ phase: 'error', percent: 0, error: err.message });
    throw err;
  }
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
