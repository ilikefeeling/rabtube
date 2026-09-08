import { create } from 'zustand';

interface UIState {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (isOpen: boolean) => void;
  isDesktopSidebarOpen: boolean;
  toggleDesktopSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isDrawerOpen: false,
  setIsDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  isDesktopSidebarOpen: true,
  toggleDesktopSidebar: () => set((state) => ({ isDesktopSidebarOpen: !state.isDesktopSidebarOpen })),
}));
