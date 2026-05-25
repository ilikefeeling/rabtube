'use client';

import { useState } from 'react';
import { Eye, Heart, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import type { CaseVideo } from '@/types';

const CAT_STYLES: Record<string, string> = {
  임플란트: 'bg-teal-50 text-teal-700 border-teal-100',
  보철:     'bg-blue-50 text-blue-700 border-blue-100',
  치주:     'bg-amber-50 text-amber-700 border-amber-100',
  교정:     'bg-violet-50 text-violet-700 border-violet-100',
  보존:     'bg-emerald-50 text-emerald-700 border-emerald-100',
  소아:     'bg-pink-50 text-pink-700 border-pink-100',
  구강외과:  'bg-red-50 text-red-700 border-red-100',
};

const BG_COLORS = [
  '#0d2137','#1a3a5c','#2d4a1e','#3a2a1a','#2a1a4a','#1a2a4a',
];

interface Props {
  video: CaseVideo;
  onClick: (v: CaseVideo) => void;
}

export default function VideoCard({ video, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const locale = useLocale();
  const t = useTranslations('VideoCard');
  const catStyle = CAT_STYLES[video.category] ?? 'bg-slate-50 text-slate-600 border-slate-100';
  const bgColor = BG_COLORS[video.id.charCodeAt(0) % BG_COLORS.length];
  const likeCount = video.likes?.length ?? 0;

  const fmtDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div
      className="flex flex-col cursor-pointer group"
      onClick={() => onClick(video)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden" style={{ background: bgColor }}>
        {video.thumbnailUrl ? (
          <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 25vw" />
        ) : null}

        {/* Play overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${hovered ? 'opacity-100' : 'opacity-80'}`}>
          <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
            <Play size={16} className="text-slate-800 ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Category badge */}
        <span className={`absolute top-2 left-2 text-[9px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wide ${catStyle}`}>
          {video.category}
        </span>

        {/* Duration */}
        {video.duration > 0 && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
            {fmtDuration(video.duration)}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex gap-3 mt-3 items-start px-1">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-teal-600 text-white text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
          {video.userProfile.name.slice(0, 1)}
        </div>
        
        {/* Text Info */}
        <div className="flex flex-col overflow-hidden w-full">
          <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 mb-1 group-hover:text-teal-700 transition-colors" title={video.title}>
            {video.title}
          </h3>
          <div className="text-xs text-slate-500 flex flex-col gap-0.5">
            <span className="font-medium hover:text-slate-800 transition-colors truncate">
              {t('doctor', { name: video.userProfile.name })}
            </span>
            <div className="flex items-center gap-1.5 truncate">
              <span>{t('views', { count: video.views })}</span>
              <span className="text-[10px]">•</span>
              <span>{formatDistanceToNow(video.createdAt instanceof Date ? video.createdAt : new Date(), { addSuffix: true, locale: locale === 'en' ? enUS : ko })}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-medium inline-block truncate max-w-[120px]">
                {video.toothNumber}
              </span>
              <span className="flex items-center gap-1 text-[11px] ml-auto"><Heart size={11} className={likeCount > 0 ? 'text-red-400' : 'text-slate-400'} /> {likeCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
