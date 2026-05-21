'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import VideoCard from '@/components/VideoCard';
import VideoPlayer from '@/components/VideoPlayer';
import { getCases } from '@/lib/firebaseService';
import { useAuth } from '@/lib/AuthContext';
import type { CaseVideo, CaseCategory } from '@/types';

const CATEGORIES = ['전체', '임플란트', '보철', '치주', '교정', '보존', '소아', '구강외과'] as const;

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<CaseVideo[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  const [loadingCases, setLoadingCases] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<CaseVideo | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    loadCases(activeCategory);
  }, [activeCategory, user]);

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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Filter Bar */}
      <div className="bg-white border-b border-slate-100 sticky top-14 z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2 h-11 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  activeCategory === cat
                    ? 'bg-teal-50 border-teal-400 text-teal-700'
                    : 'border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
          최근 업로드된 케이스
          {!loadingCases && <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded">{cases.length}건</span>}
        </p>

        {loadingCases ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-video bg-slate-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="text-5xl mb-4">🦷</div>
            <p className="text-sm font-medium text-slate-500">아직 케이스가 없습니다</p>
            <p className="text-xs mt-1">첫 번째 케이스를 업로드해 주세요</p>
            <button
              onClick={() => router.push('/upload')}
              className="btn-primary mt-4"
            >
              케이스 업로드
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {cases.map(v => (
              <VideoCard key={v.id} video={v} onClick={setSelectedVideo} />
            ))}
          </div>
        )}
      </main>

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
