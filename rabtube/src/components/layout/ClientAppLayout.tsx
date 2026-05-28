'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { useUIStore } from '@/store/uiStore';

export default function ClientAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isDesktopSidebarOpen } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthPage = pathname?.includes('/auth/');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {mounted && isDesktopSidebarOpen && <Sidebar />}
        <main className="flex-1 w-full relative min-w-0 overflow-y-auto flex flex-col">
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
