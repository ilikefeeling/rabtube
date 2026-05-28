'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { useUIStore } from '@/store/uiStore';

export default function ClientAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { isDesktopSidebarOpen } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthPage = pathname?.includes('/auth/');
  const isVerifyPage = pathname?.includes('/dashboard/verify');
  const needsVerification = user && profile && ['associate', 'pending', 'rejected'].includes(profile.status);

  // 미승인 상태의 유저가 메인 서비스 진입 시 강제 리다이렉트
  useEffect(() => {
    if (!authLoading && needsVerification && !isVerifyPage && !isAuthPage) {
      router.push('/dashboard/verify');
    }
  }, [authLoading, needsVerification, isVerifyPage, isAuthPage, router]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  // 리다이렉션 도중 화면 깜빡임 방지
  if (needsVerification && !isVerifyPage) {
    return <div className="h-screen bg-slate-50 flex items-center justify-center">인증 상태를 확인 중입니다...</div>;
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
