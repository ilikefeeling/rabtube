'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/lib/AuthContext';
import { uploadCaseVideo } from '@/lib/firebaseService';
import type { CaseCategory, Difficulty, Visibility, UploadProgress } from '@/types';

const CATEGORIES: CaseCategory[] = ['임플란트', '보철', '치주', '교정', '보존', '소아', '구강외과'];

export default function UploadPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<UploadProgress>({ phase: 'idle', percent: 0 });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CaseCategory | ''>('');
  const [toothNumber, setToothNumber] = useState('');
  const [tags, setTags] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('중급');
  const [visibility, setVisibility] = useState<Visibility>('회원전용');

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] },
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
    maxFiles: 1,
  });

  const handleSubmit = async () => {
    if (!file || !title || !category || !user || !profile) return;

    setProgress({ phase: 'uploading', percent: 0 });

    try {
      await uploadCaseVideo(
        file,
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Back */}
        <Link href="/" className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-6 transition-colors">
          <ChevronLeft size={14} />피드로 돌아가기
        </Link>

        <div className="card p-6">
          <h1 className="text-lg font-medium text-slate-800 mb-1">케이스 영상 업로드</h1>
          <p className="text-xs text-slate-400 mb-6">치료 케이스를 동료 원장님들과 공유해 주세요</p>

          {/* Dropzone */}
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-6 ${
                isDragActive
                  ? 'border-teal-400 bg-teal-50'
                  : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="text-3xl text-blue-400 mb-3 flex justify-center">
                <Upload size={36} />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">
                {isDragActive ? '파일을 여기에 놓으세요' : '영상 파일을 드래그하거나 클릭하여 선택'}
              </p>
              <p className="text-xs text-slate-400">MP4, MOV, AVI, WebM · 최대 2GB</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                  <Upload size={18} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                {!isUploading && !isDone && (
                  <button onClick={() => setFile(null)} className="text-xs text-slate-400 hover:text-slate-600">변경</button>
                )}
              </div>

              {/* Progress */}
              {(isUploading || isDone || isError) && (
                <div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all ${isDone ? 'bg-teal-500' : isError ? 'bg-red-400' : 'bg-teal-500'}`}
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">
                      {isDone ? '업로드 완료!' : isError ? progress.error : `${progress.percent}% 업로드 중...`}
                    </p>
                    {isDone && <CheckCircle size={14} className="text-teal-500" />}
                    {isError && <AlertCircle size={14} className="text-red-400" />}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                  케이스 카테고리 *
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as CaseCategory)}
                  className="select-field"
                  disabled={isUploading || isDone}
                >
                  <option value="">선택하세요</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                  치아 번호
                </label>
                <input
                  className="input-field"
                  placeholder="예) #16, #26"
                  value={toothNumber}
                  onChange={e => setToothNumber(e.target.value)}
                  disabled={isUploading || isDone}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                케이스 제목 *
              </label>
              <input
                className="input-field"
                placeholder="예) 상악 구치부 임플란트 즉시 식립 케이스"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={isUploading || isDone}
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                케이스 설명
              </label>
              <textarea
                className="input-field resize-none"
                rows={4}
                placeholder="케이스 특이사항, 사용 재료, 핵심 포인트를 기록해 주세요"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isUploading || isDone}
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                태그 (쉼표로 구분)
              </label>
              <input
                className="input-field"
                placeholder="예) 즉시식립, 골이식, GBR"
                value={tags}
                onChange={e => setTags(e.target.value)}
                disabled={isUploading || isDone}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                  공개 설정
                </label>
                <select
                  value={visibility}
                  onChange={e => setVisibility(e.target.value as Visibility)}
                  className="select-field"
                  disabled={isUploading || isDone}
                >
                  <option value="회원전용">회원 전용</option>
                  <option value="비공개">비공개</option>
                  <option value="전체공개">전체 공개</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
                  난이도
                </label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as Difficulty)}
                  className="select-field"
                  disabled={isUploading || isDone}
                >
                  <option>초급</option>
                  <option>중급</option>
                  <option>고급</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 mt-6 pt-5 border-t border-slate-50">
            <Link href="/" className="btn-secondary flex-1 text-center">취소</Link>
            <button
              onClick={handleSubmit}
              disabled={!file || !title || !category || isUploading || isDone}
              className="btn-primary flex-1"
            >
              {isDone ? '✓ 업로드 완료' : isUploading ? `${progress.percent}% 업로드 중...` : '업로드 시작'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
