'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    incrementViews(video.id);
    // 시청료 결제 (본인 케이스 제외)
    if (user && user.uid !== video.userId) {
      processViewPayment(user.uid, video.userId, video.id, video.title)
        .catch(console.error);
    }
    // Trap scroll
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [video.id, user]);

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
        <div className="p-5">
          <div className="flex items-center gap-2.5 mb-3.5">
            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider border border-current/15 shrink-0 shadow-sm ${catStyle}`}>
              {video.category}
            </span>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">{video.title}</h2>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs px-2.5 py-1 bg-teal-50/50 border border-teal-100/80 rounded-md text-teal-700 font-bold">
              {video.toothNumber}
            </span>
            {video.tags?.map(tag => (
              <span key={tag} className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-150 rounded-md text-slate-600 font-semibold">
                {tag}
              </span>
            ))}
            <span className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-150 rounded-md text-slate-600 font-semibold">
              난이도: {video.difficulty}
            </span>
          </div>

          {/* Description */}
          {video.description && (
            <p className="text-[15px] text-slate-600 leading-relaxed mb-4.5 border-t border-slate-100 pt-4 font-normal">
              {video.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center gap-4.5 border-t border-slate-100 pt-4">
            <div className="w-11 h-11 rounded-full bg-slate-700 text-blue-200 text-base font-bold flex items-center justify-center shrink-0">
              {video.userProfile.name.slice(0, 1)}
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">{video.userProfile.name} 원장</p>
              <p className="text-sm text-slate-500 font-medium">{video.userProfile.hospital} · {video.userProfile.region}</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-slate-500 font-semibold">
                <Eye size={14} />{video.views + 1}
              </span>
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl border font-bold transition-all ${
                  liked
                    ? 'bg-teal-50 border-teal-200 text-teal-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-teal-200'
                }`}
              >
                <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
                {likes.length}
              </button>
              <button className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:border-slate-300 font-bold transition-all">
                <Share2 size={14} />공유
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
