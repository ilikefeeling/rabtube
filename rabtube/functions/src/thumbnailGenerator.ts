/**
 * 썸네일 자동 생성
 *
 * 흐름:
 * 1. 영상 업로드 감지 (Storage trigger)
 * 2. ffmpeg로 10초 시점 프레임 추출
 * 3. Sharp로 1280×720 리사이즈 + 최적화
 * 4. Storage thumbnails/ 에 저장
 * 5. Firestore cases 문서에 thumbnailUrl 업데이트
 *
 * 주의: Cloud Functions에서 ffmpeg는 /usr/bin/ffmpeg 경로 사용
 */

import * as admin   from 'firebase-admin';
import * as os      from 'os';
import * as path    from 'path';
import * as fs      from 'fs';
import { exec }     from 'child_process';
import { promisify } from 'util';
import sharp        from 'sharp';

const execAsync = promisify(exec);
const db = new Proxy({}, {
  get: (target, prop) => {
    const firestore = admin.firestore();
    const value = Reflect.get(firestore, prop);
    return typeof value === 'function' ? value.bind(firestore) : value;
  }
}) as admin.firestore.Firestore;

const storage = new Proxy({}, {
  get: (target, prop) => {
    const storageInst = admin.storage();
    const value = Reflect.get(storageInst, prop);
    return typeof value === 'function' ? value.bind(storageInst) : value;
  }
}) as ReturnType<typeof admin.storage>;

const THUMB_WIDTH  = 1280;
const THUMB_HEIGHT = 720;
const FRAME_OFFSET = 10;  // 10초 시점 프레임

export async function generateThumbnail(
  storagePath: string,   // "videos/userId/xxx.mp4"
  caseId: string
): Promise<string | null> {
  const bucket    = storage.bucket();
  const tmpDir    = os.tmpdir();
  const videoFile = path.join(tmpDir, `video_${caseId}.mp4`);
  const frameFile = path.join(tmpDir, `frame_${caseId}.png`);
  const thumbFile = path.join(tmpDir, `thumb_${caseId}.jpg`);

  try {
    // 1. GCS에서 영상 다운로드
    await bucket.file(storagePath).download({ destination: videoFile });

    // 2. ffmpeg로 프레임 추출
    await execAsync(
      `/usr/bin/ffmpeg -i "${videoFile}" -ss ${FRAME_OFFSET} -vframes 1 -q:v 2 "${frameFile}" -y`
    );

    if (!fs.existsSync(frameFile)) {
      // 10초 없으면 첫 프레임 사용
      await execAsync(
        `/usr/bin/ffmpeg -i "${videoFile}" -vframes 1 -q:v 2 "${frameFile}" -y`
      );
    }

    // 3. Sharp로 리사이즈 + JPEG 최적화
    await sharp(frameFile)
      .resize(THUMB_WIDTH, THUMB_HEIGHT, {
        fit: 'cover',
        position: 'centre',
      })
      .jpeg({ quality: 85, progressive: true })
      .toFile(thumbFile);

    // 4. GCS 업로드
    const thumbStoragePath = `thumbnails/${caseId}.jpg`;
    await bucket.upload(thumbFile, {
      destination: thumbStoragePath,
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      },
    });

    // 공개 URL 생성
    const [url] = await bucket.file(thumbStoragePath).getSignedUrl({
      action: 'read',
      expires: '2099-01-01',
    });

    // 5. Firestore 업데이트
    await db.collection('cases').doc(caseId).update({
      thumbnailUrl: url,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return url;

  } catch (err) {
    console.error(`[ThumbnailGen] caseId=${caseId} error:`, err);
    return null;
  } finally {
    // 임시 파일 정리
    [videoFile, frameFile, thumbFile].forEach(f => {
      try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
    });
  }
}

/* ─────────────────────────────────────
   영상 길이 추출 (ffprobe)
───────────────────────────────────── */

export async function getVideoDuration(storagePath: string): Promise<number> {
  const bucket    = storage.bucket();
  const tmpDir    = os.tmpdir();
  const videoFile = path.join(tmpDir, `probe_${Date.now()}.mp4`);

  try {
    await bucket.file(storagePath).download({ destination: videoFile });
    const { stdout } = await execAsync(
      `/usr/bin/ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoFile}"`
    );
    return parseFloat(stdout.trim()) || 0;
  } catch {
    return 0;
  } finally {
    try { if (fs.existsSync(videoFile)) fs.unlinkSync(videoFile); } catch {}
  }
}
