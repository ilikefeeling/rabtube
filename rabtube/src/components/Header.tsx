'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload, Bookmark, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import RabBadge from '@/components/RabBadge';

/** 멤버십 상태 뱃지 렌더링 */
function StatusBadge({ status }: { status?: string }) {
  if (!status || status === 'APPROVED' || status === 'approved') return null;

  const config: Record<string, { label: string; emoji: string; color: string }> = {
    ASSOCIATE: { label: '준회원', emoji: '🟡', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    PENDING:   { label: '검토중', emoji: '🔵', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    REJECTED:  { label: '반려',   emoji: '🔴', color: 'bg-red-50 text-red-700 border-red-200' },
    pending:   { label: '검토중', emoji: '🔵', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    rejected:  { label: '반려',   emoji: '🔴', color: 'bg-red-50 text-red-700 border-red-200' },
  };

  const c = config[status];
  if (!c) return null;

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.color}`}>
      {c.emoji} {c.label}
    </span>
  );
}

export default function Header() {
  const { user, profile, isApproved, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const initials = profile?.name?.slice(0, 1) ?? '?';

  return (
    <header className="bg-[#0d2137] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold text-white tracking-tight">RabTube</span>
          <span className="bg-teal-600 text-white text-xs font-bold px-2 py-0.75 rounded-md uppercase tracking-wider shadow-sm">
            Beta
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white text-[15px] font-semibold px-4 py-2.2 rounded-xl hover:bg-white/10 transition-colors">
            케이스 피드
          </Link>
          {isApproved && (
            <Link href="/my" className="flex items-center gap-2 text-slate-300 hover:text-white text-[15px] font-semibold px-4 py-2.2 rounded-xl hover:bg-white/10 transition-colors">
              <Bookmark size={16} />내 케이스
            </Link>
          )}
          {profile?.role === 'admin' && (
            <Link href="/admin" className="flex items-center gap-2 text-slate-300 hover:text-white text-[15px] font-semibold px-4 py-2.2 rounded-xl hover:bg-white/10 transition-colors">
              <Settings size={16} />관리
            </Link>
          )}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {isApproved && (
                <Link href="/upload" className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-[15px] font-bold px-5 py-2.2 rounded-xl transition-colors shadow-sm">
                  <Upload size={16} />케이스 업로드
                </Link>
              )}
              <RabBadge />
              <div className="relative group">
                <div className="flex items-center gap-2">
                  <StatusBadge status={profile?.status} />
                  <div className="w-9.5 h-9.5 rounded-full bg-slate-700 border border-slate-600 text-blue-200 text-sm font-bold flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors">
                    {initials}
                  </div>
                </div>
                <div className="absolute right-0 top-11 bg-white border border-slate-150 rounded-2xl shadow-xl p-1.5 min-w-[160px] hidden group-hover:block">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 mb-1.5">
                    <p className="text-sm font-bold text-slate-800">{profile?.name} 원장</p>
                    <p className="text-xs text-slate-400 font-medium">{profile?.hospital}</p>
                  </div>
                  <Link
                    href="/points"
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    💰 포인트 내역
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <LogOut size={14} className="text-slate-450" />로그아웃
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Link href="/auth/login" className="btn-primary px-5 py-2.2 text-[15px] font-bold">로그인</Link>
          )}
        </div>
      </div>
    </header>
  );
}
