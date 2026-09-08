'use client';

import { useUIStore } from '@/store/uiStore';

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isDesktopSidebarOpen } = useUIStore();

  return (
    <div className="bg-slate-50 h-full">
      {children}
    </div>
  );
}
