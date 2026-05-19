'use client';

import { useState } from 'react';
import { Eye, Heart, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
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
      className="card cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
      onClick={() => onClick(video)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video" style={{ background: bgColor }}>
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover opacity-90" />
        ) : null}

        {/* Play overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${hovered ? 'opacity-100' : 'opacity-80'}`}>
          <div className="w-11 h-11 bg-white/95 rounded-full flex items-center justify-center shadow-md">
            <Play size={18} className="text-slate-800 ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Category badge */}
        <span className={`absolute top-2.5 left-2.5 text-[11px] font-extrabold px-2.5 py-0.75 rounded-md border uppercase tracking-wider shadow-sm ${catStyle}`}>
          {video.category}
        </span>

        {/* Duration */}
        {video.duration > 0 && (
          <span className="absolute bottom-2.5 right-2.5 bg-black/75 text-white text-xs px-2 py-0.5 rounded-md font-semibold tracking-wider">
            {fmtDuration(video.duration)}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-base font-bold text-slate-900 leading-snug line-clamp-2 mb-2.5">
          {video.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {/* Avatar */}
          <div className="w-5.5 h-5.5 rounded-full bg-slate-700 text-blue-200 text-[10px] font-bold flex items-center justify-center shrink-0">
            {video.userProfile.name.slice(0, 1)}
          </div>
          <span className="text-sm font-semibold text-slate-700">{video.userProfile.name} 원장</span>
          <span className="text-slate-300 font-bold">·</span>
          <span className="bg-teal-50/50 border border-teal-100 px-2 py-0.5 rounded-md text-xs text-teal-600 font-bold shrink-0">
            {video.toothNumber}
          </span>
          <div className="ml-auto flex items-center gap-2.5 text-xs text-slate-500 font-semibold shrink-0">
            <span className="flex items-center gap-1"><Eye size={13} />{video.views}</span>
            <span className="flex items-center gap-1"><Heart size={13} />{likeCount}</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 font-medium mt-2">
          {formatDistanceToNow(video.createdAt instanceof Date ? video.createdAt : new Date(), { addSuffix: true, locale: ko })}
        </p>
      </div>
    </div>
  );
}
