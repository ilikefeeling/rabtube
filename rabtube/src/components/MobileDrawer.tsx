'use client';

import { useUIStore } from '@/store/uiStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bookmark, CreditCard, Settings, ArrowDownToLine, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function MobileDrawer() {
  const { isDrawerOpen, setIsDrawerOpen } = useUIStore();
  const pathname = usePathname();
  const { profile } = useAuth();
  const t = useTranslations('Sidebar');

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname, setIsDrawerOpen]);

  const navItems = [
    { href: '/', icon: Home, label: t('feed') },
    { href: '/my', icon: Bookmark, label: t('my_cases') },
    { href: '/billing', icon: CreditCard, label: t('billing') },
  ];

  const adminItems = profile?.role === 'admin' ? [
    { href: '/admin', icon: Settings, label: t('admin_home') },
    { href: '/admin/cashout', icon: ArrowDownToLine, label: t('admin_cashout') },
  ] : [];

  if (!isDrawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 z-50 animate-in fade-in" 
        onClick={() => setIsDrawerOpen(false)}
      />
      
      {/* Drawer */}
      <aside className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
        <div className="h-14 flex items-center px-4 border-b border-slate-100 justify-between shrink-0">
          <Link href="/" onClick={() => setIsDrawerOpen(false)} className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg leading-none mt-0.5">R</span>
            </div>
            <span className="font-sans font-bold text-xl tracking-tighter text-slate-900">RabTube</span>
          </Link>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-1">
          <div className="px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-slate-100 font-semibold text-slate-900' 
                      : 'hover:bg-slate-100/80 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-slate-900' : 'text-slate-600'} />
                  <span className="text-sm tracking-tight">{item.label}</span>
                </Link>
              );
            })}

            {adminItems.length > 0 && (
              <>
                <div className="my-4 border-t border-slate-100" />
                <div className="px-3 pb-2 pt-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</span>
                </div>
                {adminItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-4 px-3 py-2.5 rounded-xl transition-colors ${
                        isActive 
                          ? 'bg-red-50 font-semibold text-red-700' 
                          : 'hover:bg-slate-100/80 text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-red-600' : 'text-slate-600'} />
                      <span className="text-sm tracking-tight">{item.label}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
