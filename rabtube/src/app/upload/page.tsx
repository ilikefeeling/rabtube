'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import {
  Upload, CheckCircle, AlertCircle, ChevronLeft,
  Film, ImageIcon, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import CaseStepEditor, { createInitialSteps } from '@/components/CaseStepEditor';
import { useAuth } from '@/lib/AuthContext';
import { uploadCaseWithSteps } from '@/lib/firebaseService';
import type {
  CaseCategory, Difficulty, Visibility,
  UploadProgress, CaseStepDraft,
} from '@/types';

const CATEGORIES: CaseCategory[] = ['임플란트', '보철', '치주', '교정', '보존', '소아', '구강외과'];

export default function UploadPage() {
  const { user, profile, loading: authLoading, isApproved } = useAuth();
  const router = useRouter();

  // 정회원이 아니면 메인으로 리다이렉트
  useEffect(() => {
    if (!authLoading && user && !isApproved) {
      router.push('/');
    }
  }, [authLoading, user, isApproved, router]);

  /* ── 기본 정보 ── */
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CaseCategory | ''>('');
  const [toothNumber, setToothNumber] = useState('');
  const [tags, setTags] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('중급');
  const [visibility, setVisibility] = useState<Visibility>('회원전용');

  /* ── 타임라인 단계 ── */
  const [steps, setSteps] = useState<CaseStepDraft[]>(createInitialSteps);

  /* ── 영상 (선택) ── */
  const [videoFile, setVideoFile] = useState<File | null>(null);

  /* ── 업로드 상태 ── */
  const [progress, setProgress] = useState<UploadProgress & { detail?: string }>({
    phase: 'idle',
    percent: 0,
  });

  const onVideoDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setVideoFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onVideoDrop,
    accept: { 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] },
    maxSize: 2 * 1024 * 1024 * 1024,
    maxFiles: 1,
  });

  /* ── 유효성 검사 ── */
  const hasAnyImages = steps.some(s => s.files.length > 0);
  const isFormValid = title && category && hasAnyImages;

  /* ── 제출 ── */
  const handleSubmit = async () => {
    if (!isFormValid || !user || !profile) return;

    try {
      await uploadCaseWithSteps(
        steps,
        videoFile,
        user.uid,
        {
          title,
          description,
          category: category as CaseCategory,
          toothNumber,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          difficulty,
          visibility,
        },
        profile,
        (p) => setProgress(p)
      );

      setTimeout(() => router.push('/my'), 1500);
    } catch (e: any) {
      setProgress({ phase: 'error', percent: 0, error: e.message });
    }
  };

  const isUploading = progress.phase === 'uploading' || progress.phase === 'processing';
  const isDone = progress.phase === 'done';
  const isError = progress.phase === 'error';
  const isLocked = isUploading || isDone;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Back */}
        <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8 font-semibold transition-colors">
          <ChevronLeft size={16} />피드로 돌아가기
        </Link>

        {/* ── 페이지 헤더 ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
              <Sparkles size={16} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">케이스 타임라인 업로드</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium ml-[42px]">
            치료 과정을 단계별 사진으로 기록하고 동료 원장님들과 공유하세요
          </p>
        </div>

        {/* ═══ Section A: 기본 정보 ═══ */}
        <div className="card p-6 mb-4">
          <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 bg-slate-100 rounded-md flex items-center justify-center text-[10px] font-black text-slate-400">A</span>
            기본 정보
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">케이스 카테고리 *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as CaseCategory)}
                  className="select-field text-sm font-medium py-2.5 h-10"
                  disabled={isLocked}
                >
                  <option value="">선택하세요</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">치아 번호</label>
                <input
                  className="input-field text-sm font-medium py-2.5 h-10"
                  placeholder="예) #16, #26"
                  value={toothNumber}
                  onChange={e => setToothNumber(e.target.value)}
                  disabled={isLocked}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">케이스 제목 *</label>
              <input
                className="input-field text-sm font-medium py-2.5 h-10"
                placeholder="예) 상악 구치부 임플란트 즉시 식립 케이스"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={isLocked}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">케이스 설명</label>
              <textarea
                className="input-field text-sm font-medium py-2.5 resize-none"
                rows={3}
                placeholder="케이스 특이사항, 사용 재료, 핵심 포인트를 기록해 주세요"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isLocked}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">태그 (쉼표로 구분)</label>
              <input
                className="input-field text-sm font-medium py-2.5 h-10"
                placeholder="예) 즉시식립, 골이식, GBR"
                value={tags}
                onChange={e => setTags(e.target.value)}
                disabled={isLocked}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">공개 설정</label>
                <select
                  value={visibility}
                  onChange={e => setVisibility(e.target.value as Visibility)}
                  className="select-field text-sm font-medium py-2.5 h-10"
                  disabled={isLocked}
                >
                  <option value="회원전용">회원 전용</option>
                  <option value="비공개">비공개</option>
                  <option value="전체공개">전체 공개</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">난이도</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as Difficulty)}
                  className="select-field text-sm font-medium py-2.5 h-10"
                  disabled={isLocked}
                >
                  <option>초급</option>
                  <option>중급</option>
                  <option>고급</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Section B: 치료 타임라인 ═══ */}
        <div className="card p-6 mb-4">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-5 h-5 bg-gradient-to-br from-amber-400 to-teal-400 rounded-md flex items-center justify-center text-[10px] font-black text-white">B</span>
            <span className="text-sm font-bold text-slate-700">치료 과정 기록</span>
          </div>

          <CaseStepEditor
            steps={steps}
            onChange={setSteps}
            disabled={isLocked}
          />

          {!hasAnyImages && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                <ImageIcon size={14} />
                각 단계에 최소 1장의 사진을 추가해 주세요
              </p>
            </div>
          )}
        </div>

        {/* ═══ Section C: 영상 첨부 (선택) ═══ */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-5 h-5 bg-slate-100 rounded-md flex items-center justify-center text-[10px] font-black text-slate-400">C</span>
            <span className="text-sm font-bold text-slate-700">영상 첨부</span>
            <span className="text-[10px] font-bold text-slate-300 bg-slate-100 px-2 py-0.5 rounded-full">선택</span>
          </div>

          {!videoFile ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-teal-400 bg-teal-50'
                  : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
              } ${isLocked ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input {...getInputProps()} />
              <div className="text-slate-300 mb-2 flex justify-center">
                <Film size={32} />
              </div>
              <p className="text-sm font-bold text-slate-500 mb-1">
                {isDragActive ? '파일을 여기에 놓으세요' : '치료 영상을 추가하시겠어요?'}
              </p>
              <p className="text-[11px] font-medium text-slate-400">MP4, MOV, AVI, WebM · 최대 2GB</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                  <Film size={16} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{videoFile.name}</p>
                  <p className="text-xs text-slate-400">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                {!isLocked && (
                  <button onClick={() => setVideoFile(null)} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">
                    변경
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══ Progress Bar ═══ */}
        {(isUploading || isDone || isError) && (
          <div className="card p-5 mb-4">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isDone ? 'bg-teal-500' : isError ? 'bg-red-400' : 'bg-gradient-to-r from-teal-400 to-blue-500'
                }`}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">
                {isDone ? '✓ 업로드 완료!' : isError ? progress.error : progress.detail || `${progress.percent}%`}
              </p>
              {isDone && <CheckCircle size={16} className="text-teal-500" />}
              {isError && <AlertCircle size={16} className="text-red-400" />}
            </div>
          </div>
        )}

        {/* ═══ Submit ═══ */}
        <div className="flex gap-4 mt-2">
          <Link href="/" className="btn-secondary flex-1 text-center text-[15px] font-bold py-3 rounded-xl">
            취소
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isLocked}
            className="btn-primary flex-1 text-[15px] font-bold py-3 rounded-xl transition-all shadow-sm disabled:opacity-40"
          >
            {isDone ? '✓ 업로드 완료' : isUploading ? (progress.detail || '업로드 중...') : '케이스 업로드'}
          </button>
        </div>
      </main>
    </div>
  );
}
