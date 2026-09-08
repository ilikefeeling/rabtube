'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckCircle, XCircle, Clock, AlertTriangle, Star } from 'lucide-react';

interface QualityCheck {
  verdict:      'pass' | 'fail' | 'review' | null;
  score:        number;
  failReasons:  string[];
  aiChecks?: {
    durationPass:    boolean;
    isDentalContent: boolean;
    noFaceDetected:  boolean;
    notDuplicate:    boolean;
    notStaticFrame:  boolean;
  };
  communityFlags: number;
  tier?: 'gold' | 'silver' | 'bronze' | 'none';
}

interface Props {
  caseId: string;
  compact?: boolean;
}

const TIER_STYLES = {
  gold:   { bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700', label: '🥇 GOLD'   },
  silver: { bg: 'bg-slate-50',  border: 'border-slate-200', text: 'text-slate-600', label: '🥈 SILVER' },
  bronze: { bg: 'bg-orange-50', border: 'border-orange-200',text: 'text-orange-700',label: '🥉 BRONZE' },
  none:   { bg: 'bg-slate-50',  border: 'border-slate-200', text: 'text-slate-500', label: '일반'       },
};

const AI_CHECK_LABELS = [
  { key: 'durationPass',     label: '영상 길이 (최소 2분)' },
  { key: 'isDentalContent',  label: '치과 콘텐츠 감지' },
  { key: 'noFaceDetected',   label: '환자 얼굴 미노출' },
  { key: 'notDuplicate',     label: '중복 영상 없음' },
  { key: 'notStaticFrame',   label: '정상 영상 (정지화면 아님)' },
] as const;

export default function QualityBadge({ caseId, compact = false }: Props) {
  const [quality, setQuality] = useState<QualityCheck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'quality_checks', caseId),
      (snap) => {
        if (snap.exists()) setQuality(snap.data() as QualityCheck);
        else setQuality(null);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [caseId]);

  if (loading) return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400 animate-pulse">
      <Clock size={12} />검수 중...
    </div>
  );

  if (!quality) return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400">
      <Clock size={12} />검수 대기
    </div>
  );

  const { verdict, score, failReasons, aiChecks, tier = 'none' } = quality;
  const tierStyle = TIER_STYLES[tier] ?? TIER_STYLES.none;

  // compact 모드: 뱃지만 표시
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {verdict === 'pass' && (
          <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tierStyle.bg} ${tierStyle.border} ${tierStyle.text}`}>
            <CheckCircle size={10} />{tierStyle.label}
          </span>
        )}
        {verdict === 'fail' && (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600">
            <XCircle size={10} />검수 실패
          </span>
        )}
        {verdict === 'review' && (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600">
            <AlertTriangle size={10} />검토 중
          </span>
        )}
        {score > 0 && (
          <span className="text-[10px] text-slate-400">{score}점</span>
        )}
      </div>
    );
  }

  // 상세 모드
  return (
    <div className={`rounded-xl border p-4 ${
      verdict === 'pass'   ? 'bg-teal-50 border-teal-100' :
      verdict === 'fail'   ? 'bg-red-50 border-red-100' :
      'bg-amber-50 border-amber-100'
    }`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {verdict === 'pass' && <CheckCircle size={16} className="text-teal-600" />}
          {verdict === 'fail' && <XCircle    size={16} className="text-red-500" />}
          {verdict === 'review' && <AlertTriangle size={16} className="text-amber-500" />}
          <span className="text-sm font-medium text-slate-800">
            {verdict === 'pass' ? 'AI 품질 검수 통과' :
             verdict === 'fail' ? 'AI 품질 검수 실패' : 'AI 검토 중'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {tier !== 'none' && verdict === 'pass' && (
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${tierStyle.bg} ${tierStyle.border} ${tierStyle.text}`}>
              {tierStyle.label}
            </span>
          )}
          {score > 0 && (
            <div className="flex items-center gap-1">
              <Star size={12} className="text-amber-500" fill="currentColor" />
              <span className="text-sm font-medium text-slate-700">{score}점</span>
            </div>
          )}
        </div>
      </div>

      {/* 점수 바 */}
      {score > 0 && (
        <div className="mb-3">
          <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                score >= 85 ? 'bg-amber-400' :
                score >= 70 ? 'bg-teal-500'  :
                score >= 50 ? 'bg-blue-400'  : 'bg-red-400'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}

      {/* AI 체크 항목 */}
      {aiChecks && (
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {AI_CHECK_LABELS.map(({ key, label }) => {
            const passed = aiChecks[key];
            return (
              <div key={key} className="flex items-center gap-1.5 text-[11px]">
                {passed
                  ? <CheckCircle size={11} className="text-teal-500 shrink-0" />
                  : <XCircle    size={11} className="text-red-400 shrink-0" />
                }
                <span className={passed ? 'text-slate-600' : 'text-red-500'}>{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 실패 사유 */}
      {failReasons?.length > 0 && (
        <div className="space-y-1">
          {failReasons.map((r, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-red-600">
              <AlertTriangle size={11} className="mt-0.5 shrink-0" />
              {r}
            </div>
          ))}
        </div>
      )}

      {/* 신고 수 */}
      {quality.communityFlags > 0 && (
        <div className="mt-2 text-[11px] text-amber-600 flex items-center gap-1">
          <AlertTriangle size={10} />
          커뮤니티 신고 {quality.communityFlags}건
        </div>
      )}
    </div>
  );
}
