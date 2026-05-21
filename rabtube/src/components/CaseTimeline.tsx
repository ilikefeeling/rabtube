'use client';

import { useState } from 'react';
import { CircleDot, ArrowDown, CheckCircle2, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import type { CaseStep, StepType } from '@/types';

/* ─── 단계 스타일 ─── */
const STEP_LABEL: Record<StepType, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  cause: {
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    label: '원인 / 초진',
    icon: <CircleDot size={14} className="text-amber-500" />,
  },
  process: {
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    label: '치료 과정',
    icon: <ArrowDown size={14} className="text-blue-500" />,
  },
  result: {
    color: 'text-teal-600',
    bg: 'bg-teal-50 border-teal-200',
    label: '치료 결과',
    icon: <CheckCircle2 size={14} className="text-teal-500" />,
  },
};

const DOT_COLORS: Record<StepType, string> = {
  cause: 'bg-amber-500',
  process: 'bg-blue-500',
  result: 'bg-teal-500',
};

/* ═══════════════════════════════════════════
   CaseTimeline — 열람용 타임라인 뷰어
   ═══════════════════════════════════════════ */

interface Props {
  steps: CaseStep[];
}

export default function CaseTimeline({ steps }: Props) {
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const sorted = [...steps].sort((a, b) => a.order - b.order);

  if (sorted.length === 0) return null;

  return (
    <>
      <div className="space-y-0 py-2">
        {/* 섹션 타이틀 */}
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-500 via-blue-500 to-teal-500" />
          치료 타임라인
        </h3>

        <div className="relative">
          {/* 세로 연결선 */}
          <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-amber-300 via-blue-300 to-teal-300 rounded-full" />

          <div className="space-y-3">
            {sorted.map((step) => {
              const style = STEP_LABEL[step.type];
              return (
                <div key={step.id} className="flex gap-3">
                  {/* 도트 */}
                  <div className="flex flex-col items-center pt-3 shrink-0">
                    <div className={`w-[8px] h-[8px] rounded-full ${DOT_COLORS[step.type]} ring-2 ring-white shadow-sm z-10`} />
                  </div>

                  {/* 카드 */}
                  <div className={`flex-1 border rounded-xl p-3.5 ${style.bg}`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {style.icon}
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {style.label}
                      </span>
                    </div>

                    {step.label && (
                      <p className="text-sm font-bold text-slate-800 mb-1">{step.label}</p>
                    )}
                    {step.description && (
                      <p className="text-xs text-slate-500 leading-relaxed mb-2">{step.description}</p>
                    )}

                    {/* 사진 그리드 */}
                    {step.imageUrls.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {step.imageUrls.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => setLightboxImg(url)}
                            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-white/50 shadow-sm group cursor-pointer"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                              <ZoomIn size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Lightbox 모달 ── */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxImg}
            alt="확대 이미지"
            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
