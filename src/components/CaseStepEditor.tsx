'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Plus, Trash2, ImagePlus, GripVertical, X,
  CircleDot, ArrowDown, CheckCircle2,
} from 'lucide-react';
import type { CaseStepDraft, StepType } from '@/types';
import { MAX_IMAGES_PER_STEP } from '@/types';

/* ─── helper: 고유 ID 생성 ─── */
let _counter = 0;
function uid(): string {
  return `step_${Date.now()}_${++_counter}`;
}

/* ─── 단계 타입별 스타일 ─── */
const STEP_STYLES: Record<StepType, { dot: string; bg: string; label: string; icon: React.ReactNode }> = {
  cause: {
    dot: 'bg-amber-500',
    bg: 'border-amber-200 bg-amber-50/40',
    label: '원인 / 초진',
    icon: <CircleDot size={16} className="text-amber-500" />,
  },
  process: {
    dot: 'bg-blue-500',
    bg: 'border-blue-200 bg-blue-50/30',
    label: '치료 과정',
    icon: <ArrowDown size={16} className="text-blue-500" />,
  },
  result: {
    dot: 'bg-teal-500',
    bg: 'border-teal-200 bg-teal-50/40',
    label: '치료 결과',
    icon: <CheckCircle2 size={16} className="text-teal-500" />,
  },
};

/* ─── 초기 단계 생성 헬퍼 ─── */
export function createInitialSteps(): CaseStepDraft[] {
  return [
    { id: uid(), type: 'cause', label: '', description: '', files: [], previews: [], order: 0 },
    { id: uid(), type: 'result', label: '', description: '', files: [], previews: [], order: 1 },
  ];
}

/* ═══════════════════════════════════════════
   CaseStepEditor — 타임라인 단계 에디터
   ═══════════════════════════════════════════ */

interface Props {
  steps: CaseStepDraft[];
  onChange: (steps: CaseStepDraft[]) => void;
  disabled?: boolean;
}

export default function CaseStepEditor({ steps, onChange, disabled }: Props) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  /* ── 단계 업데이트 ── */
  const updateStep = useCallback((id: string, patch: Partial<CaseStepDraft>) => {
    onChange(steps.map(s => s.id === id ? { ...s, ...patch } : s));
  }, [steps, onChange]);

  /* ── 과정 단계 추가 ── */
  const addProcessStep = useCallback(() => {
    // 결과 직전에 삽입
    const resultIdx = steps.findIndex(s => s.type === 'result');
    const newStep: CaseStepDraft = {
      id: uid(),
      type: 'process',
      label: '',
      description: '',
      files: [],
      previews: [],
      order: resultIdx,
    };
    const updated = [...steps];
    updated.splice(resultIdx, 0, newStep);
    // order 재정렬
    onChange(updated.map((s, i) => ({ ...s, order: i })));
  }, [steps, onChange]);

  /* ── 과정 단계 삭제 (cause/result는 삭제 불가) ── */
  const removeStep = useCallback((id: string) => {
    const filtered = steps.filter(s => s.id !== id);
    // 삭제된 단계의 previews 정리
    const removed = steps.find(s => s.id === id);
    removed?.previews.forEach(url => URL.revokeObjectURL(url));
    onChange(filtered.map((s, i) => ({ ...s, order: i })));
  }, [steps, onChange]);

  /* ── 사진 추가 ── */
  const addImages = useCallback((stepId: string, newFiles: FileList | File[]) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    const remaining = MAX_IMAGES_PER_STEP - step.files.length;
    const filesToAdd = Array.from(newFiles).slice(0, remaining);
    if (filesToAdd.length === 0) return;

    const newPreviews = filesToAdd.map(f => URL.createObjectURL(f));
    updateStep(stepId, {
      files: [...step.files, ...filesToAdd],
      previews: [...step.previews, ...newPreviews],
    });
  }, [steps, updateStep]);

  /* ── 사진 삭제 ── */
  const removeImage = useCallback((stepId: string, imgIdx: number) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    URL.revokeObjectURL(step.previews[imgIdx]);
    updateStep(stepId, {
      files: step.files.filter((_, i) => i !== imgIdx),
      previews: step.previews.filter((_, i) => i !== imgIdx),
    });
  }, [steps, updateStep]);

  /* ── 전체 사진 수 ── */
  const totalImages = steps.reduce((sum, s) => sum + s.files.length, 0);

  return (
    <div className="space-y-0">
      {/* ── 섹션 헤더 ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-700">치료 타임라인 *</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            치료 과정을 단계별로 기록해 주세요 · 사진 {totalImages}장
          </p>
        </div>
        <button
          type="button"
          onClick={addProcessStep}
          disabled={disabled}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
        >
          <Plus size={14} /> 과정 추가
        </button>
      </div>

      {/* ── 타임라인 ── */}
      <div className="relative">
        {/* 세로 연결선 */}
        <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-amber-300 via-blue-300 to-teal-300 rounded-full" />

        <div className="space-y-4">
          {steps.map((step, idx) => {
            const style = STEP_STYLES[step.type];
            const isFixed = step.type === 'cause' || step.type === 'result';
            const placeholderLabel = step.type === 'cause' ? '예) 치주 질환' :
              step.type === 'result' ? '예) 완치 결과' : `예) ${idx}차 치료`;

            return (
              <div key={step.id} className="flex gap-3">
                {/* 도트 */}
                <div className="flex flex-col items-center pt-3.5 shrink-0">
                  <div className={`w-[10px] h-[10px] rounded-full ${style.dot} ring-2 ring-white shadow-sm z-10`} />
                </div>

                {/* 카드 */}
                <div className={`flex-1 border rounded-xl p-4 transition-all ${style.bg} ${disabled ? 'opacity-60' : ''}`}>
                  {/* 헤더 */}
                  <div className="flex items-center gap-2 mb-3">
                    {style.icon}
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {style.label}
                    </span>
                    {!isFixed && !disabled && (
                      <button
                        type="button"
                        onClick={() => removeStep(step.id)}
                        className="ml-auto text-slate-300 hover:text-red-400 transition-colors"
                        title="이 단계 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* 단계명 */}
                  <input
                    type="text"
                    placeholder={placeholderLabel}
                    value={step.label}
                    onChange={e => updateStep(step.id, { label: e.target.value })}
                    disabled={disabled}
                    className="input-field text-sm font-semibold py-2 h-9 mb-2"
                  />

                  {/* 설명 */}
                  <textarea
                    placeholder="이 단계의 상세 설명 (선택)"
                    value={step.description}
                    onChange={e => updateStep(step.id, { description: e.target.value })}
                    disabled={disabled}
                    rows={2}
                    className="input-field text-xs font-medium py-2 resize-none mb-3"
                  />

                  {/* 사진 그리드 */}
                  <div className="flex flex-wrap gap-2">
                    {step.previews.map((url, imgIdx) => (
                      <div key={imgIdx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => removeImage(step.id, imgIdx)}
                            className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} className="text-white" />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* 사진 추가 버튼 */}
                    {step.files.length < MAX_IMAGES_PER_STEP && !disabled && (
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[step.id]?.click()}
                        className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <ImagePlus size={18} className="text-slate-300" />
                        <span className="text-[9px] font-bold text-slate-300">
                          {step.files.length}/{MAX_IMAGES_PER_STEP}
                        </span>
                      </button>
                    )}

                    {/* hidden file input */}
                    <input
                      ref={el => { fileInputRefs.current[step.id] = el; }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={e => {
                        if (e.target.files) addImages(step.id, e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </div>

                  {step.files.length === 0 && (
                    <p className="text-[10px] text-slate-300 mt-1 font-medium">
                      JPG, PNG, WebP · 단계당 최대 {MAX_IMAGES_PER_STEP}장
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 과정 추가 버튼 (하단) ── */}
      {!disabled && steps.filter(s => s.type === 'process').length < 10 && (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={addProcessStep}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 px-4 py-2 rounded-lg border border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
          >
            <Plus size={14} /> 치료 과정 단계 추가
          </button>
        </div>
      )}
    </div>
  );
}
