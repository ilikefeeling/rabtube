'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Upload, Bookmark, LogOut, Settings, CreditCard, ShoppingBag, Search, Menu } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import RabBadge from '@/components/RabBadge';
import MobileDrawer from '@/components/MobileDrawer';
import { useUIStore } from '@/store/uiStore';
import { useTranslations, useLocale } from 'next-intl';

export default function Header() {
  const t = useTranslations('Header');
  const locale = useLocale();
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { setIsDrawerOpen, toggleDesktopSidebar } = useUIStore();
  const pathname = usePathname();

  const handleHamburgerClick = () => {
    if (window.innerWidth >= 768 && pathname === '/') {
      toggleDesktopSidebar();
    } else {
      setIsDrawerOpen(true);
    }
  };

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
    <header className="bg-white sticky top-0 z-40 border-b border-slate-200 h-14 flex items-center justify-between px-4">
      {/* Left: Logo & Menu */}
      <div className="flex items-center gap-4 min-w-[200px]">
        <button 
          onClick={handleHamburgerClick}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors block"
        >
          <Menu size={20} className="text-slate-700" />
        </button>
        <Link href="/" className="flex items-center gap-1.5">
          <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg leading-none mt-0.5">R</span>
          </div>
          <span className="font-sans font-bold text-xl tracking-tighter text-slate-900 hidden sm:block">RabTube</span>
        </Link>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex flex-1 max-w-[600px] mx-4 items-center">
        <div className="flex w-full items-center border border-slate-300 rounded-full overflow-hidden bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:shadow-inner transition-all">
          <div className="pl-4 pr-2 text-slate-400">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder={t('search_ph')} 
            className="w-full bg-transparent border-none outline-none py-2 text-sm text-slate-900"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                router.push(`/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`);
              }
            }}
          />
          <button className="px-5 py-2 bg-slate-100 border-l border-slate-300 hover:bg-slate-200 transition-colors">
            <Search size={18} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-[200px] justify-end">
        <select 
          value={locale}
          onChange={(e) => {
            const newLocale = e.target.value;
            const currentPath = pathname.replace(/^\/(ko|en)/, '') || '/';
            window.location.href = `/${newLocale}${currentPath === '/' ? '' : currentPath}`;
          }}
          className="text-xs bg-slate-100 text-slate-600 border border-slate-200 rounded-md px-2 py-1 outline-none hover:bg-slate-200 transition-colors cursor-pointer hidden sm:block"
        >
          <option value="ko">KR</option>
          <option value="en">EN</option>
        </select>
        
        {user ? (
          <>
            <div className="hidden sm:block">
              <RabBadge />
            </div>
            <Link href="/upload" className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium px-3 sm:px-4 py-1.5 rounded-full transition-colors">
              <Upload size={16} />
              <span className="hidden sm:inline">{t('upload')}</span>
            </Link>
            <div ref={dropdownRef} className="relative group ml-2">
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsOpen(prev => !prev);
                }}
                className="list-none outline-none cursor-pointer w-8 h-8 rounded-full bg-teal-600 text-white text-xs font-semibold flex items-center justify-center hover:bg-teal-700 transition-colors ring-2 ring-transparent focus:ring-slate-200"
              >
                {initials}
              </button>
              
              {isOpen && (
                <div className="absolute right-0 top-10 bg-white border border-slate-100 rounded-xl shadow-lg p-1 min-w-[140px] z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-medium text-slate-800">{t('doctor', { name: profile?.name ?? '' })}</p>
                    <p className="text-[11px] text-slate-400">{profile?.hospital}</p>
                  </div>
                  <Link 
                    href="/points" 
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg"
                  >
                    💰 {t('points')}
                  </Link>
                  <Link 
                    href="/my" 
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg"
                  >
                    <Bookmark size={14} /> {t('my_cases')}
                  </Link>
                  <Link 
                    href="/marketplace" 
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg"
                  >
                    <ShoppingBag size={14} /> 마켓플레이스
                  </Link>
                  {profile?.role === 'admin' && (
                    <Link 
                      href="/billing" 
                      onClick={() => setIsOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg"
                    >
                      <CreditCard size={14} />RAB 충전
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut size={14} />{t('logout')}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link href="/auth/login" className="btn-primary rounded-full px-5">{t('login')}</Link>
        )}
      </div>
      <MobileDrawer />
    </header>
  );
}
