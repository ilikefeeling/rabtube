'use client';

import { usePoints } from '@/hooks/usePoints';
import Link from 'next/link';
import { Coins, Clock } from 'lucide-react';

export default function RabBadge() {
  const { balance, loading } = usePoints();

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 text-slate-400 text-xs font-semibold px-3 py-1.5 rounded-full animate-pulse h-8">
        <div className="w-3.5 h-3.5 bg-slate-200 rounded-full" />
        <span className="w-12 h-3 bg-slate-200 rounded" />
      </div>
    );
  }

  const confirmed = balance?.balance ?? 0;
  const pending = balance?.pendingBalance ?? 0;

  return (
    <Link
      href="/points"
      className="flex items-center gap-2 bg-amber-50/70 hover:bg-amber-50 border border-amber-200/60 hover:border-amber-300 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-300 hover:shadow-sm group h-8"
      title="RAB 포인트 내역으로 이동"
    >
      {/* Coin Icon with rotating/shining animation on hover */}
      <div className="relative flex items-center justify-center">
        <Coins 
          size={14} 
          className="text-amber-500 transition-transform duration-500 group-hover:rotate-[360deg] group-hover:scale-110" 
        />
        {/* Glow effect */}
        <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-0 group-hover:opacity-20 group-hover:animate-ping" />
      </div>

      <span className="font-sans font-bold text-[11px] text-amber-600 tracking-wider">
        RAB
      </span>
      
      <span className="font-bold text-slate-800 tabular-nums">
        {confirmed.toLocaleString()}
      </span>

      {pending > 0 && (
        <span className="flex items-center gap-1 bg-amber-100/80 border border-amber-200/40 text-[10px] text-amber-700 px-1.5 py-0.5 rounded-full font-bold ml-0.5 animate-pulse">
          <Clock size={10} className="text-amber-600 shrink-0" />
          <span>+{pending.toLocaleString()}</span>
        </span>
      )}
    </Link>
  );
}
