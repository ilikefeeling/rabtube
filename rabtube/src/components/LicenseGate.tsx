'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  ShieldCheck, Clock, AlertTriangle, Upload, CheckCircle, FileText, RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { uploadLicenseFile, submitLicenseForReview } from '@/lib/firebaseService';
import type { UploadProgress } from '@/types';

/**
 * LicenseGate — 준회원/검토대기/반려 상태에서 핵심 기능을 차단하는 게이트 컴포넌트
 *
 * status별 표시:
 *  ASSOCIATE → 면허증 업로드 드롭존
 *  PENDING   → 검토 대기 안내
 *  REJECTED  → 반려 사유 + 재업로드
 *  APPROVED  → 렌더하지 않음 (null)
 */
export default function LicenseGate() {
  const { user, profile, isApproved, refreshProfile } = useAuth();
  const [progress, setProgress] = useState<UploadProgress>({ phase: 'idle', percent: 0 });
  const [showReupload, setShowReupload] = useState(false);

  const onDrop = useCallback(async (accepted: File[]) => {
    const file = accepted[0];
    if (!file || !user) return;

    try {
      setProgress({ phase: 'uploading', percent: 0 });
      const url = await uploadLicenseFile(file, user.uid, setProgress);
      await submitLicenseForReview(user.uid, url);
      await refreshProfile();
    } catch (e: any) {
      setProgress({ phase: 'error', percent: 0, error: e.message });
    }
  }, [user, refreshProfile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    maxFiles: 1,
  });

  // 정회원이면 게이트 해제
  if (isApproved) return null;

  const status = profile?.status;
  const isUploading = progress.phase === 'uploading' || progress.phase === 'processing';
  const isDone = progress.phase === 'done';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative overflow-hidden">

        {/* ── ASSOCIATE: 면허증 업로드 ── */}
        {(status === 'ASSOCIATE' || status === 'REJECTED' && showReupload) && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <ShieldCheck className="text-amber-500" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">정회원 인증이 필요합니다</h2>
                <p className="text-sm text-slate-500">
                  치과의사 면허증을 업로드하시면 관리자 검토 후 정회원으로 승인됩니다.
                </p>
              </div>
            </div>

            {/* Dropzone */}
            {!isDone && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-5 ${
                  isDragActive
                    ? 'border-teal-400 bg-teal-50'
                    : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex justify-center mb-3">
                  <FileText size={36} className="text-teal-500" />
                </div>
                <p className="text-sm font-bold text-slate-700 mb-1">
                  {isDragActive ? '파일을 여기에 놓으세요' : '보건복지부 치과의사 면허증'}
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  PDF 또는 사진 파일 (JPG, PNG) · 최대 20MB
                </p>
              </div>
            )}

            {/* Progress */}
            {(isUploading || isDone) && (
              <div className="mb-5">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${isDone ? 'bg-teal-500' : 'bg-teal-500'}`}
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  {isDone ? (
                    <><CheckCircle size={14} className="text-teal-500" /> 면허증이 성공적으로 제출되었습니다!</>
                  ) : (
                    `${progress.percent}% 업로드 중...`
                  )}
                </p>
              </div>
            )}

            {progress.phase === 'error' && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle size={14} />
                {progress.error || '업로드 중 오류가 발생했습니다'}
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
              <p className="font-bold text-slate-600 mb-1">📋 제출 안내</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>보건복지부 발급 치과의사 면허증 원본 사진 또는 PDF</li>
                <li>영업일 기준 1~2일 내 검토 완료</li>
                <li>승인 완료 후 모든 기능을 이용하실 수 있습니다</li>
              </ul>
            </div>
          </>
        )}

        {/* ── PENDING: 검토 대기 ── */}
        {status === 'PENDING' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5">
              <Clock className="text-blue-500 animate-pulse" size={28} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">면허증 검토 중입니다</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              제출해 주신 면허증을 관리자가 확인하고 있습니다.<br />
              <span className="font-semibold text-slate-600">영업일 기준 1~2일</span> 내에 승인이 완료됩니다.
            </p>
            {profile?.licenseSubmittedAt && (
              <p className="text-xs text-slate-400">
                제출 일시: {profile.licenseSubmittedAt.toLocaleDateString('ko-KR')}
              </p>
            )}
            <button
              onClick={() => refreshProfile()}
              className="mt-5 flex items-center gap-2 mx-auto text-sm text-teal-600 font-semibold hover:text-teal-700 transition-colors"
            >
              <RefreshCw size={14} /> 승인 상태 새로고침
            </button>
          </div>
        )}

        {/* ── REJECTED: 반려 ── */}
        {status === 'REJECTED' && !showReupload && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="text-red-500" size={28} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">면허 인증이 반려되었습니다</h2>
            {profile?.rejectionReason && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700 mb-5 text-left">
                <p className="font-bold text-red-800 mb-1">반려 사유</p>
                <p>{profile.rejectionReason}</p>
              </div>
            )}
            <p className="text-sm text-slate-500 mb-6">
              면허증을 다시 제출하시면 재검토가 진행됩니다.
            </p>
            <button
              onClick={() => setShowReupload(true)}
              className="btn-primary px-6 py-2.5 text-sm font-bold"
            >
              면허증 재업로드
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
