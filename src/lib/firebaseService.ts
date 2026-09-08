import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs, deleteDoc, setDoc,
  query, where, orderBy, limit, increment,
  arrayUnion, arrayRemove, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject, uploadBytes
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

export async function checkDuplicatePhoneNumber(phoneNumber: string): Promise<boolean> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (!cleanPhone) return false;
  const snap = await getDoc(doc(db, 'phone_numbers', cleanPhone));
  return snap.exists();
}

export async function checkDuplicateCI(ciValue: string): Promise<boolean> {
  if (!ciValue) return false;
  const snap = await getDoc(doc(db, 'ci_values', ciValue));
  return snap.exists();
}

export async function createUserProfile(
  uid: string,
  data: Omit<UserProfile, 'uid' | 'createdAt' | 'status' | 'role'> & { ciName?: string }
) {
  // 본인인증 이름과 프로필 표시 이름이 다를 경우 보안 처리
  if (data.ciName && data.name !== data.ciName) {
    throw new Error('본인인증된 실명과 가입 이름이 일치하지 않습니다.');
  }

  const ref = doc(db, COLLECTIONS.USERS, uid);
  const isTargetAdmin = data.email === 'ilikefeeling@gmail.com';
  const role = isTargetAdmin ? 'admin' : 'user';
  const status = isTargetAdmin ? 'approved' : 'associate'; // 선 가입 후 승인 전략: 기본 '준회원(associate)'

  // ciName은 저장 시 제거해도 되지만 일단 삭제
  const { ciName, ...profileDataToSave } = data;

  const profileData = {
    ...profileDataToSave,
    uid,
    status,
    role,
    createdAt: serverTimestamp(),
  };

  await updateDoc(ref, profileData).catch(async () => {
    await setDoc(ref, profileData);
  });

  // 휴대폰 번호 중복 가입 방지 컬렉션 등록
  if (data.phoneNumber) {
    const cleanPhone = data.phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone) {
      await setDoc(doc(db, 'phone_numbers', cleanPhone), { uid });
    }
  }

  // CI 값 중복 가입 방지 컬렉션 등록
  if (data.ciValue) {
    await setDoc(doc(db, 'ci_values', data.ciValue), { uid });
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  if (!snap.exists()) return null;
  const d = snap.data();

  // ilikefeeling@gmail.com 사용자의 경우 자동으로 admin 권한을 부여하고 DB에 동기화합니다.
  if (d.email === 'ilikefeeling@gmail.com' && d.role !== 'admin') {
    d.role = 'admin';
    updateDoc(doc(db, COLLECTIONS.USERS, uid), { role: 'admin' }).catch(console.error);
  }

  return {
    ...d,
    createdAt: (d.createdAt as Timestamp)?.toDate() ?? new Date(),
  } as UserProfile;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const q = query(
    collection(db, COLLECTIONS.USERS),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      ...data,
      uid: d.id,
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    } as UserProfile;
  });
}

export async function updateUserStatus(userId: string, newStatus: string, rejectionReason?: string) {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const dataToUpdate: any = { status: newStatus };
  if (newStatus === 'rejected') {
    dataToUpdate.rejectionReason = rejectionReason || '면허증 정보가 일치하지 않거나 식별이 어렵습니다.';
  } else if (newStatus === 'approved') {
    dataToUpdate.rejectionReason = '';
  }
  await updateDoc(userRef, dataToUpdate);
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

// 검색 엔진용: 카테고리 1차 필터링 후 최대 100건 가져오기
export async function getAllCasesForSearch(category?: string): Promise<CaseVideo[]> {
  let q = query(
    collection(db, COLLECTIONS.CASES),
    where('visibility', '!=', '비공개'),
    orderBy('visibility'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  if (category && category !== '전체') {
    q = query(
      collection(db, COLLECTIONS.CASES),
      where('category', '==', category),
      where('visibility', '!=', '비공개'),
      orderBy('visibility'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
  }
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
  thumbnailFile: File | Blob | null,
  onProgress: (p: UploadProgress) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const path = `videos/${userId}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);

    let contentType = file.type || 'video/mp4';
    if (ext === 'mov' || contentType === 'video/quicktime') {
      contentType = 'video/mp4';
    }

    const task = uploadBytesResumable(storageRef, file, {
      contentType: contentType,
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

        let thumbnailUrl = '';
        if (thumbnailFile) {
          const thumbExt = thumbnailFile instanceof File ? thumbnailFile.name.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg';
          const thumbRef = ref(storage, `thumbnails/${userId}/${Date.now()}_thumb.${thumbExt}`);
          await uploadBytes(thumbRef, thumbnailFile, { contentType: thumbnailFile.type || 'image/jpeg' });
          thumbnailUrl = await getDownloadURL(thumbRef);
        }

        const docData: any = {
          userId,
          userProfile: {
            name: userProfile.name,
            hospital: userProfile.hospital,
            region: userProfile.region,
          },
          ...metadata,
          videoUrl,
          thumbnailUrl,
          duration: 0,
          views: 0,
          likes: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Remove undefined fields to prevent Firestore errors
        if (docData.clinical === undefined) {
          delete docData.clinical;
        }

        const docRef = await addDoc(collection(db, COLLECTIONS.CASES), docData);

        // 업로드 보상 지급 (48h pending)
        const userCreatedAt = userProfile.createdAt instanceof Date
          ? userProfile.createdAt
          : new Date();
        awardUploadReward(userId, docRef.id, userCreatedAt).catch(console.error);

        // 업로드 일회성 수수료 과금 (RAB)
        import('./billingService').then(({ calculateUploadFeeRab }) => {
          const uploadFee = calculateUploadFeeRab(metadata.price || 0);
          if (uploadFee > 0) {
            import('./pointService').then(({ processUploadFee }) => {
              processUploadFee(userId, docRef.id, metadata.title, uploadFee).catch(console.error);
            });
          }
        });

        onProgress({ phase: 'done', percent: 100 });
        resolve(docRef.id);
      }
    );
  });
}

export function updateCaseVideo(
  caseId: string,
  userId: string,
  metadata: Partial<Omit<CaseVideo, 'id' | 'userId' | 'userProfile' | 'videoUrl' | 'thumbnailUrl' | 'duration' | 'views' | 'likes' | 'createdAt' | 'updatedAt'>>,
  file: File | null,
  oldVideoUrl: string | null,
  thumbnailFile: File | Blob | null,
  onProgress: (p: UploadProgress) => void
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const path = `videos/${userId}/${Date.now()}.${ext}`;
        const storageRef = ref(storage, path);
        let contentType = file.type || 'video/mp4';
        if (ext === 'mov' || contentType === 'video/quicktime') {
          contentType = 'video/mp4';
        }
        
        const task = uploadBytesResumable(storageRef, file, { contentType });
        
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
            
            if (oldVideoUrl) {
              try { await deleteObject(ref(storage, oldVideoUrl)); } catch(e) {}
            }
            
            const docData: any = { ...metadata, videoUrl, updatedAt: serverTimestamp() };
            if (thumbnailFile) {
              const thumbExt = thumbnailFile instanceof File ? thumbnailFile.name.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg';
              const thumbRef = ref(storage, `thumbnails/${userId}/${Date.now()}_thumb.${thumbExt}`);
              await uploadBytes(thumbRef, thumbnailFile, { contentType: thumbnailFile.type || 'image/jpeg' });
              docData.thumbnailUrl = await getDownloadURL(thumbRef);
            }
            if (docData.clinical === undefined) delete docData.clinical;
            
            await updateDoc(doc(db, COLLECTIONS.CASES, caseId), docData);
            onProgress({ phase: 'done', percent: 100 });
            resolve();
          }
        );
      } else {
        onProgress({ phase: 'processing', percent: 50 });
        const docData: any = { ...metadata, updatedAt: serverTimestamp() };
        if (thumbnailFile) {
          const thumbExt = thumbnailFile instanceof File ? thumbnailFile.name.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg';
          const thumbRef = ref(storage, `thumbnails/${userId}/${Date.now()}_thumb.${thumbExt}`);
          await uploadBytes(thumbRef, thumbnailFile, { contentType: thumbnailFile.type || 'image/jpeg' });
          docData.thumbnailUrl = await getDownloadURL(thumbRef);
        }
        if (docData.clinical === undefined) delete docData.clinical;
        await updateDoc(doc(db, COLLECTIONS.CASES, caseId), docData);
        onProgress({ phase: 'done', percent: 100 });
        resolve();
      }
    } catch (e: any) {
      onProgress({ phase: 'error', percent: 0, error: e.message });
      reject(e);
    }
  });
}

export async function deleteCaseVideo(caseId: string, videoUrl: string) {
  try {
    const storageRef = ref(storage, videoUrl);
    await deleteObject(storageRef);
  } catch (_) {}
  await deleteDoc(doc(db, COLLECTIONS.CASES, caseId));
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

export async function submitLicenseForReview(
  userId: string, 
  licenseUrl: string, 
  additionalInfo?: {
    name?: string;
    phoneNumber?: string;
    hospital?: string;
    region?: string;
    licenseNumber?: string;
  }
) {
  const { serverTimestamp: st } = await import('firebase/firestore');
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  
  const updateData: any = {
    licenseUrl,
    status: 'pending',
    licenseSubmittedAt: st(),
    rejectionReason: '',
  };

  if (additionalInfo) {
    if (additionalInfo.name) updateData.name = additionalInfo.name;
    if (additionalInfo.phoneNumber) updateData.phoneNumber = additionalInfo.phoneNumber;
    if (additionalInfo.hospital) updateData.hospital = additionalInfo.hospital;
    if (additionalInfo.region) updateData.region = additionalInfo.region;
    if (additionalInfo.licenseNumber) updateData.licenseNumber = additionalInfo.licenseNumber;
  }

  await updateDoc(userRef, updateData);
}

export function uploadGenericImage(file: File, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${ext}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type || 'image/jpeg' });

    task.on(
      'state_changed',
      null,
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

/* ── CUSTOM MATERIALS ── */

const DEFAULT_MATERIALS = [
  'Osstem TS III', 'Dentium SuperLine', 'Straumann BLX', 'NeoBiotech', 'MegaGen AnyRidge',
  'Bio-Oss', 'OCS-B', 'Jason membrane', '3M Lava', 'Katana Zirconia', 'E.max', 'Cerec',
  'Fuji IX', 'RelyX U200', 'Emdogain', 'Geistlich Mucograft', 'OssBuilder', 'CollaTape',
  'Damon Clear', 'Invisalign', 'Incognito', 'Tomy', 'Dentaurum', 'Filtek Z350',
  'Tetric N-Ceram', 'Charisma', 'MTA', 'Cavit', 'Gutta Percha', 'SS Crown', 'NuSmile',
  'Fuji II LC', 'Ketac Molar', 'Formocresol', 'Surgicel', 'CollaPlug', 'Bone wax',
  'Vicryl 4-0', 'Nylon 5-0'
];

export async function getCustomMaterials(): Promise<string[]> {
  const ref = doc(db, 'settings', 'materials');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data().items ?? [];
  }
  // 기본 재료로 초기화
  const { setDoc } = await import('firebase/firestore');
  await setDoc(ref, { items: DEFAULT_MATERIALS });
  return DEFAULT_MATERIALS;
}

export async function addCustomMaterial(name: string): Promise<void> {
  const ref = doc(db, 'settings', 'materials');
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const { setDoc } = await import('firebase/firestore');
    await setDoc(ref, { items: [...DEFAULT_MATERIALS, name] });
  } else {
    await updateDoc(ref, {
      items: arrayUnion(name)
    });
  }
}

export async function deleteCustomMaterial(name: string): Promise<void> {
  const ref = doc(db, 'settings', 'materials');
  await updateDoc(ref, {
    items: arrayRemove(name)
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
