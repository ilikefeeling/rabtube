'use client';

import { useEffect, useState, useRef } from 'react';
import { X, Heart, Eye, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
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

const CAT_KEYS: Record<string, string> = {
  전체: 'cat_all',
  임플란트: 'cat_implant',
  보철: 'cat_prosthetics',
  치주: 'cat_perio',
  교정: 'cat_ortho',
  보존: 'cat_cons',
  소아: 'cat_pedo',
  구강외과: 'cat_surgery'
};

interface Props {
  video: CaseVideo;
  onClose: () => void;
}

export default function VideoPlayer({ video, onClose }: Props) {
  const t = useTranslations('VideoPlayer');
  const tHome = useTranslations('HomePage');
  const { user } = useAuth();
  const [likes, setLikes] = useState<string[]>(video.likes ?? []);
  const liked = user ? likes.includes(user.uid) : false;

  const [isLoading, setIsLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);

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
      className="fixed inset-0 bg-black/80 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full flex items-start sm:items-center justify-center p-2 pt-12 sm:p-4">
        <div
          className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Video */}
          <div className="relative bg-[#0d2137] w-full flex items-center justify-center overflow-hidden" style={{ minHeight: '30vh' }}>

            {isLoading && !videoError && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d2137]/80">
                <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            
            {/* Blurred Background for Vertical Videos */}
            {video.thumbnailUrl && (
              <div 
                className="absolute inset-0 z-0 opacity-50 blur-xl scale-110"
                style={{ 
                  backgroundImage: `url(${video.thumbnailUrl})`, 
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center' 
                }}
              />
            )}

            {videoError ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0d2137] text-white p-6 text-center">
                <AlertCircle size={32} className="text-red-400 mb-3" />
                <p className="font-medium">{t('err_load_title')}</p>
                <p className="text-sm text-slate-400 mt-1">{t('err_load_desc')}</p>
              </div>
            ) : (
              <video
                src={video.videoUrl}
                controls
                controlsList="nodownload"
                onContextMenu={e => e.preventDefault()}
                className="relative z-10 w-full max-h-[75vh] object-contain drop-shadow-2xl"
                autoPlay
                muted
                playsInline
                onCanPlay={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setVideoError(t('err_playback'));
                }}
              />
            )}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-20"
            >
              <X size={14} />
            </button>
          </div>

          {/* Info */}
          <div className="p-4">
          <div className="flex items-start gap-2 mb-3">
            <span className={`text-[10px] font-semibold px-2 py-1 rounded uppercase tracking-wide shrink-0 ${catStyle}`}>
              {CAT_KEYS[video.category] ? tHome(CAT_KEYS[video.category]) : video.category}
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
              {t('diff')}: {video.difficulty}
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
              <h3 className="font-semibold text-slate-700 mb-1.5">{t('clinical_info')}</h3>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                {video.clinical.diagnosis && video.clinical.diagnosis.length > 0 && (
                  <div><span className="text-slate-400 mr-1">{t('diag')}</span>{video.clinical.diagnosis.join(', ')}</div>
                )}
                {video.clinical.technique && video.clinical.technique.length > 0 && (
                  <div><span className="text-slate-400 mr-1">{t('tech')}</span>{video.clinical.technique.join(', ')}</div>
                )}
                {video.clinical.materials && video.clinical.materials.length > 0 && (
                  <div className="col-span-2"><span className="text-slate-400 mr-1">{t('mat')}</span>{video.clinical.materials.join(', ')}</div>
                )}
                {video.clinical.boneClassification && (
                  <div><span className="text-slate-400 mr-1">{t('bone')}</span>{video.clinical.boneClassification}</div>
                )}
                {(video.clinical.patientAge || video.clinical.patientGender) && (
                  <div><span className="text-slate-400 mr-1">{t('pat')}</span>{video.clinical.patientAge} {video.clinical.patientGender}</div>
                )}
                {video.clinical.systemicConditions && video.clinical.systemicConditions.length > 0 && (
                  <div className="col-span-2"><span className="text-slate-400 mr-1">{t('sys')}</span>{video.clinical.systemicConditions.join(', ')}</div>
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
              <p className="text-sm font-medium text-slate-800">{t('doctor', { name: video.userProfile.name })}</p>
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
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
