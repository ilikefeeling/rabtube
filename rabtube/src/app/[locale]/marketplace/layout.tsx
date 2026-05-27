'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useUIStore } from '@/store/uiStore';

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isDesktopSidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {isDesktopSidebarOpen && <Sidebar />}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </div>
      </div>
    </div>
  );
}
