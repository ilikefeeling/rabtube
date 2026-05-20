'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload, Bookmark, LogOut, Settings, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import RabBadge from '@/components/RabBadge';

/** 멤버십 상태 뱃지 렌더링 */
function StatusBadge({ status }: { status?: string }) {
  if (!status || status === 'APPROVED' || status === 'approved') return null;

  const config: Record<string, { label: string; emoji: string; color: string }> = {
    ASSOCIATE: { label: '준회원', emoji: '🟡', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
    PENDING:   { label: '검토중', emoji: '🔵', color: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
    REJECTED:  { label: '반려',   emoji: '🔴', color: 'bg-red-500/10 text-red-300 border-red-500/20' },
    pending:   { label: '검토중', emoji: '🔵', color: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
    rejected:  { label: '반려',   emoji: '🔴', color: 'bg-red-500/10 text-red-300 border-red-500/20' },
  };

  const c = config[status];
  if (!c) return null;

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.color} whitespace-nowrap`}>
      {c.emoji} {c.label}
    </span>
  );
}

export default function Header() {
  const { user, profile, isApproved, signOut } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const initials = profile?.name?.slice(0, 1) ?? '?';

  return (
    <header className="bg-[#0d2137] sticky top-0 z-40 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="font-serif text-2xl font-bold text-white tracking-tight">RabTube</span>
          <span className="bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
            Beta
          </span>
        </Link>

        {/* Nav (Desktop only: md and up) */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white text-[14px] font-semibold px-3 py-2 rounded-xl hover:bg-white/10 transition-all duration-200">
            케이스 피드
          </Link>
          {isApproved && (
            <Link href="/my" className="flex items-center gap-1.5 text-slate-300 hover:text-white text-[14px] font-semibold px-3 py-2 rounded-xl hover:bg-white/10 transition-all duration-200">
              <Bookmark size={15} />내 케이스
            </Link>
          )}
          {profile?.role === 'admin' && (
            <Link href="/admin" className="flex items-center gap-1.5 text-slate-300 hover:text-white text-[14px] font-semibold px-3 py-2 rounded-xl hover:bg-white/10 transition-all duration-200">
              <Settings size={15} />관리
            </Link>
          )}
        </nav>

        {/* Right Action Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Upload Button: icon on mobile, text on sm and up */}
              {isApproved && (
                <Link 
                  href="/upload" 
                  className="flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[14px] font-bold px-3 py-2 sm:px-4 sm:py-2 rounded-xl transition-all duration-200 shadow-sm"
                >
                  <Upload size={16} />
                  <span className="hidden sm:inline">케이스 업로드</span>
                </Link>
              )}

              {/* Points Badge: hidden on small viewports, always visible inside the mobile menu drawer */}
              <div className="hidden sm:block">
                <RabBadge />
              </div>

              {/* User Avatar & Dropdown (Desktop hover menu) */}
              <div className="hidden md:block relative group">
                <div className="flex items-center gap-2">
                  <StatusBadge status={profile?.status} />
                  <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 text-blue-200 text-sm font-bold flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors">
                    {initials}
                  </div>
                </div>
                <div className="absolute right-0 top-11 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 min-w-[160px] hidden group-hover:block z-50">
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
                    <LogOut size={14} className="text-slate-400" />로그아웃
                  </button>
                </div>
              </div>

              {/* Mobile Menu Button (Hamburger menu for screens below md) */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden flex items-center justify-center p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="메뉴 열기"
              >
                <Menu size={24} />
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="btn-primary px-4 py-2 text-[14px] font-bold">
              로그인
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Drawer (Responsive slide-out / overlay navigation) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer panel */}
          <div className="relative w-80 max-w-full bg-[#0d2137] h-full flex flex-col p-6 shadow-2xl z-10 border-l border-white/10 transition-transform duration-300 ease-out transform translate-x-0">
            {/* Top Close Bar */}
            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="font-serif text-2xl font-bold text-white tracking-tight">RabTube</span>
                <span className="bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase">Beta</span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="메뉴 닫기"
              >
                <X size={24} />
              </button>
            </div>

            {/* Profile Summary Card inside Drawer */}
            {user && (
              <div className="my-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 text-blue-200 text-base font-bold flex items-center justify-center">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{profile?.name} 원장</p>
                    <p className="text-xs text-slate-400 font-medium">{profile?.hospital}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[13px]">
                  <span className="text-slate-400">회원 상태</span>
                  <StatusBadge status={profile?.status || 'ASSOCIATE'} />
                </div>

                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-slate-400">보유 포인트</span>
                  <RabBadge />
                </div>
              </div>
            )}

            {/* Nav Menu Links inside Drawer */}
            <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium text-[15px] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>📰</span> 케이스 피드
              </Link>

              {isApproved && (
                <Link
                  href="/my"
                  className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium text-[15px] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Bookmark size={16} className="text-slate-400" /> 내 케이스
                </Link>
              )}

              {profile?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium text-[15px] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings size={16} className="text-slate-400" /> 관리 대시보드
                </Link>
              )}

              {isApproved && (
                <Link
                  href="/upload"
                  className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium text-[15px] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Upload size={16} className="text-slate-400" /> 케이스 업로드
                </Link>
              )}

              <Link
                href="/points"
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium text-[15px] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>💰</span> 포인트 내역
              </Link>
            </div>

            {/* Logout Footer inside Drawer */}
            {user && (
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl font-bold text-[15px] transition-colors"
                >
                  <LogOut size={16} />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
