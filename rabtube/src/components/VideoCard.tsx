'use client';

import { useState } from 'react';
import { Eye, Heart, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Image from 'next/image';
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
      className="card cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-150"
      onClick={() => onClick(video)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video" style={{ background: bgColor }}>
        {video.thumbnailUrl ? (
          <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover opacity-90" sizes="(max-width:768px) 50vw, 20vw" />
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
      <div className="p-3">
        <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2 mb-2">
          {video.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {/* Avatar */}
          <div className="w-5 h-5 rounded-full bg-slate-700 text-blue-300 text-[9px] font-semibold flex items-center justify-center shrink-0">
            {video.userProfile.name.slice(0, 1)}
          </div>
          <span className="text-slate-500">{video.userProfile.name} 원장</span>
          <span className="text-slate-200">·</span>
          <span className="bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-500 font-medium">
            {video.toothNumber}
          </span>
          <div className="ml-auto flex items-center gap-2.5">
            <span className="flex items-center gap-1"><Eye size={11} />{video.views}</span>
            <span className="flex items-center gap-1"><Heart size={11} />{likeCount}</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-300 mt-1.5">
          {formatDistanceToNow(video.createdAt instanceof Date ? video.createdAt : new Date(), { addSuffix: true, locale: ko })}
        </p>
      </div>
    </div>
  );
}
