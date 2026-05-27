'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import VideoCard from '@/components/VideoCard';
import VideoPlayer from '@/components/VideoPlayer';
import { getCases } from '@/lib/firebaseService';
import { useAuth } from '@/lib/AuthContext';
import type { CaseVideo, CaseCategory } from '@/types';

import { useUIStore } from '@/store/uiStore';
import { useTranslations } from 'next-intl';

const CATEGORIES = ['전체', '임플란트', '보철', '치주', '교정', '보존', '소아', '구강외과'] as const;

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { isDesktopSidebarOpen } = useUIStore();
  const [cases, setCases] = useState<CaseVideo[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  const [loadingCases, setLoadingCases] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<CaseVideo | null>(null);
  const t = useTranslations('HomePage');
  const [mounted, setMounted] = useState(false);

  const getCatLabel = (key: string) => {
    switch (key) {
      case '전체': return t('cat_all');
      case '임플란트': return t('cat_implant');
      case '보철': return t('cat_prosthetics');
      case '치주': return t('cat_perio');
      case '교정': return t('cat_ortho');
      case '보존': return t('cat_cons');
      case '소아': return t('cat_pedo');
      case '구강외과': return t('cat_surgery');
      default: return key;
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user || !mounted) return;
    loadCases(activeCategory);
  }, [activeCategory, user, mounted]);

  const loadCases = async (cat: string) => {
    setLoadingCases(true);
    try {
      const data = await getCases(cat === '전체' ? undefined : cat);
      setCases(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push('/auth/login');
    }
  }, [mounted, authLoading, user, router]);

  if (!mounted || authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Filter Bar */}
          <div className="bg-white sticky top-0 z-30 pb-2 pt-3">
            <div className="px-4 sm:px-6">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    {getCatLabel(cat)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <main className="px-4 sm:px-6 py-4 pb-12">
            {loadingCases ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-3 animate-pulse">
                    <div className="aspect-video bg-slate-200 rounded-xl" />
                    <div className="flex gap-3 px-1">
                      <div className="w-9 h-9 bg-slate-200 rounded-full shrink-0" />
                      <div className="flex flex-col gap-2 w-full pt-1">
                        <div className="h-4 bg-slate-200 rounded w-11/12" />
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : cases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                <div className="text-6xl mb-6">🦷</div>
                <p className="text-lg font-medium text-slate-600">{t('empty_title')}</p>
                <p className="text-sm mt-2">{t('empty_desc')}</p>
                <button
                  onClick={() => router.push('/upload')}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-full font-medium mt-6 transition-colors"
                >
                  {t('btn_upload')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                {cases.map(v => (
                  <VideoCard key={v.id} video={v} onClick={setSelectedVideo} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Player Modal */}
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}
