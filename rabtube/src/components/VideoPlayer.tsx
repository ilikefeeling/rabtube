'use client';

import { useEffect, useState, useRef } from 'react';
import { X, Heart, Share2, Eye } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { toggleLike, incrementViews } from '@/lib/firebaseService';
import { processViewPayment } from '@/lib/pointService';
import type { CaseVideo } from '@/types';

const CAT_STYLES: Record<string, string> = {
  임플란트: 'bg-teal-50 text-teal-700',
  보철:     'bg-blue-50 text-blue-700',
  치주:     'bg-amber-50 text-amber-700',
  교정:     'bg-violet-50 text-violet-700',
  보존:     'bg-emerald-50 text-emerald-700',
  소아:     'bg-pink-50 text-pink-700',
  구강외과:  'bg-red-50 text-red-700',
};

interface Props {
  video: CaseVideo;
  onClose: () => void;
}

export default function VideoPlayer({ video, onClose }: Props) {
  const { user } = useAuth();
  const [likes, setLikes] = useState<string[]>(video.likes ?? []);
  const liked = user ? likes.includes(user.uid) : false;

  const viewTracked = useRef(false);

  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    incrementViews(video.id);
    // 시청료 결제 (본인 케이스 제외)
    if (user && user.uid !== video.userId) {
      processViewPayment(user.uid, video.userId, video.id, video.title, video.price ?? 0)
        .catch(console.error);
    }
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [video.id, video.userId, video.title, video.price, user]);

  const handleLike = async () => {
    if (!user) return;
    const newLikes = liked
      ? likes.filter(id => id !== user.uid)
      : [...likes, user.uid];
    setLikes(newLikes);
    await toggleLike(video.id, user.uid, liked, video.userId);
  };

  const catStyle = CAT_STYLES[video.category] ?? 'bg-slate-50 text-slate-600';

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Video */}
        <div className="relative bg-[#0d2137] aspect-video">
          <video
            src={video.videoUrl}
            controls
            className="w-full h-full"
            autoPlay
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start gap-2 mb-3">
            <span className={`text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wide shrink-0 ${catStyle}`}>
              {video.category}
            </span>
            <h2 className="text-[15px] font-medium text-slate-800 leading-snug">{video.title}</h2>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="text-[11px] px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-500">
              {video.toothNumber}
            </span>
            {video.tags?.map(tag => (
              <span key={tag} className="text-[11px] px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-500">
                {tag}
              </span>
            ))}
            <span className="text-[11px] px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-500">
              난이도: {video.difficulty}
            </span>
          </div>

          {/* Description */}
          {video.description && (
            <p className="text-sm text-slate-500 leading-relaxed mb-3 border-t border-slate-50 pt-3">
              {video.description}
            </p>
          )}

          {/* Clinical Metadata */}
          {video.clinical && (
            <div className="mb-3 border-t border-slate-50 pt-3 text-[11px] text-slate-600">
              <h3 className="font-semibold text-slate-700 mb-1.5">임상 정보</h3>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                {video.clinical.diagnosis && video.clinical.diagnosis.length > 0 && (
                  <div><span className="text-slate-400 mr-1">진단명:</span>{video.clinical.diagnosis.join(', ')}</div>
                )}
                {video.clinical.technique && video.clinical.technique.length > 0 && (
                  <div><span className="text-slate-400 mr-1">시술/테크닉:</span>{video.clinical.technique.join(', ')}</div>
                )}
                {video.clinical.materials && video.clinical.materials.length > 0 && (
                  <div className="col-span-2"><span className="text-slate-400 mr-1">사용재료:</span>{video.clinical.materials.join(', ')}</div>
                )}
                {video.clinical.boneClassification && (
                  <div><span className="text-slate-400 mr-1">골분류:</span>{video.clinical.boneClassification}</div>
                )}
                {(video.clinical.patientAge || video.clinical.patientGender) && (
                  <div><span className="text-slate-400 mr-1">환자:</span>{video.clinical.patientAge} {video.clinical.patientGender}</div>
                )}
                {video.clinical.systemicConditions && video.clinical.systemicConditions.length > 0 && (
                  <div className="col-span-2"><span className="text-slate-400 mr-1">전신질환:</span>{video.clinical.systemicConditions.join(', ')}</div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 border-t border-slate-50 pt-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 text-blue-300 text-sm font-semibold flex items-center justify-center shrink-0">
              {video.userProfile.name.slice(0, 1)}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">{video.userProfile.name} 원장</p>
              <p className="text-xs text-slate-400">{video.userProfile.hospital} · {video.userProfile.region}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Eye size={13} />{video.views + 1}
              </span>
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  liked
                    ? 'bg-teal-50 border-teal-200 text-teal-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-teal-200'
                }`}
              >
                <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
                {likes.length}
              </button>
              <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-slate-300 transition-all">
                <Share2 size={13} />공유
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
