'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bookmark, CreditCard, Settings, ArrowDownToLine, Info, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslations } from 'next-intl';

export default function Sidebar() {
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/^\/[a-zA-Z]{2}/, '') || '/';
  const { profile } = useAuth();
  const t = useTranslations('Sidebar');

  const navItems = [
    { href: '/', icon: Home, label: t('feed') },
    { href: '/about', icon: Info, label: t('about') },
    { href: '/marketplace', icon: ShoppingBag, label: t('marketplace') },
    { href: '/my', icon: Bookmark, label: t('my_cases') },
    { href: '/billing', icon: CreditCard, label: t('billing') },
  ];

  const adminItems = profile?.role === 'admin' ? [
    { href: '/admin', icon: Settings, label: t('admin_home') },
  ] : [];

  return (
    <aside className="hidden md:flex flex-col w-60 h-[calc(100vh-56px)] sticky top-14 bg-white border-r border-slate-100 overflow-y-auto shrink-0 z-20 hover:scrollbar-default scrollbar-hide py-3">
      <div className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = normalizedPath === item.href || (item.href !== '/' && normalizedPath.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors relative ${
                isActive 
                  ? 'bg-slate-100 font-bold text-slate-900' 
                  : 'hover:bg-slate-100/80 text-slate-700 hover:text-slate-900 font-medium'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-slate-900' : 'text-slate-500'} />
              <span className="text-[17px] tracking-tight">{item.label}</span>
              {isActive && (
                <div className="w-2 h-2 rounded-full bg-teal-500 ml-auto shadow-sm" />
              )}
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
              const isActive = normalizedPath === item.href || (item.href !== '/' && normalizedPath.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors relative ${
                    isActive 
                      ? 'bg-red-50 font-bold text-red-700' 
                      : 'hover:bg-slate-100/80 text-slate-700 hover:text-slate-900 font-medium'
                  }`}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-red-600' : 'text-slate-500'} />
                  <span className="text-[17px] tracking-tight">{item.label}</span>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-red-600 ml-auto shadow-sm" />
                  )}
                </Link>
              );
            })}
          </>
        )}
      </div>
      
      <div className="px-6 py-4 mt-auto">
        <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
          © 2026 RabTube<br/>
          Dental Clinical Cases
        </p>
      </div>
    </aside>
  );
}
