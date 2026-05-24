'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload, Bookmark, Users, LogOut, Settings, CreditCard, ArrowDownToLine, Search } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import RabBadge from '@/components/RabBadge';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const initials = profile?.name?.slice(0, 1) ?? '?';

  return (
    <header className="bg-[#0d2137] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-xl text-white tracking-tight">RabTube</span>
          <span className="bg-teal-600 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide">
            Beta
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <Link href="/" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
            케이스 피드
          </Link>
          <Link href="/search" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <Search size={14} />검색
          </Link>
          <Link href="/my" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <Bookmark size={14} />내 케이스
          </Link>
          <Link href="/billing" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <CreditCard size={14} />결제
          </Link>
          {profile?.role === 'admin' && (
            <>
              <Link href="/admin" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <Settings size={14} />관리
              </Link>
              <Link href="/admin/cashout" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <ArrowDownToLine size={14} />환전처리
              </Link>
            </>
          )}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <RabBadge />
              <Link href="/upload" className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
                <Upload size={14} />케이스 업로드
              </Link>
              <div ref={dropdownRef} className="relative group">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(prev => !prev);
                  }}
                  className="list-none outline-none cursor-pointer w-8 h-8 rounded-full bg-slate-700 text-blue-300 text-xs font-semibold flex items-center justify-center hover:bg-slate-600 transition-colors"
                >
                  {initials}
                </button>
                
                {isOpen && (
                  <div className="absolute right-0 top-10 bg-white border border-slate-100 rounded-xl shadow-lg p-1 min-w-[140px] z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-medium text-slate-800">{profile?.name} 원장</p>
                      <p className="text-[11px] text-slate-400">{profile?.hospital}</p>
                    </div>
                    <Link 
                      href="/points" 
                      onClick={() => setIsOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg"
                    >
                      💰 포인트 내역
                    </Link>
                    <Link 
                      href="/my" 
                      onClick={() => setIsOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg"
                    >
                      <Bookmark size={12} /> 내 케이스 관리
                    </Link>
                    {profile?.role === 'admin' && (
                      <Link 
                        href="/billing" 
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg"
                      >
                        <CreditCard size={12} />결제 관리
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg"
                    >
                      <LogOut size={12} />로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/auth/login" className="btn-primary">로그인</Link>
          )}
        </div>
      </div>
    </header>
  );
}
