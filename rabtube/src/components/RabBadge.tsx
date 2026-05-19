'use client';

import { usePoints } from '@/hooks/usePoints';
import Link from 'next/link';

export default function RabBadge() {
  const { balance, loading } = usePoints();

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 bg-white/10 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-lg animate-pulse">
        <span className="w-16 h-3 bg-white/20 rounded" />
      </div>
    );
  }

  const confirmed = balance?.balance ?? 0;
  const pending = balance?.pendingBalance ?? 0;

  return (
    <Link
      href="/points"
      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
    >
      <span className="text-[10px] font-bold text-amber-300 tracking-wide">RAB</span>
      <span>{confirmed.toLocaleString()}</span>
      {pending > 0 && (
        <span className="text-amber-300 text-[11px]">
          +{pending}↻
        </span>
      )}
    </Link>
  );
}
