'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import VideoCard from '@/components/VideoCard';
import VideoPlayer from '@/components/VideoPlayer';
import LicenseGate from '@/components/LicenseGate';
import { getCases } from '@/lib/firebaseService';
import { useAuth } from '@/lib/AuthContext';
import type { CaseVideo, CaseCategory } from '@/types';
import { Flame } from 'lucide-react';

const CATEGORIES = ['전체', '임플란트', '보철', '치주', '교정', '보존', '소아', '구강외과'] as const;

export default function HomePage() {
  const { user, profile, loading: authLoading, isApproved } = useAuth();
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

  /** 비디오 클릭 핸들러 — 정회원만 재생 가능 */
  const handleVideoClick = (video: CaseVideo) => {
    if (!isApproved) return; // 게이트 모달이 이미 떠 있으므로 동작 안 함
    setSelectedVideo(video);
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

      {/* 면허 인증 게이트 (준회원/검토대기/반려 시 표시) */}
      <LicenseGate />

      {/* Filter Bar */}
      <div className="bg-white border-b border-slate-100 sticky top-14 z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-2.5 h-14 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                  activeCategory === cat
                    ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-teal-400 hover:text-teal-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* 실시간 인기 케이스 (전체 탭이면서 데이터가 있을 때만 노출) */}
        {activeCategory === '전체' && !loadingCases && cases.length > 0 && (
          <div className="mb-10 bg-gradient-to-br from-white to-teal-50/10 border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Flame className="text-rose-500 animate-pulse shrink-0" size={22} fill="currentColor" />
                  실시간 인기 케이스
                </h2>
                <p className="text-xs text-slate-500 mt-1">동료 의사들이 가장 많이 시청하고 추천한 명품 케이스입니다.</p>
              </div>
              <span className="text-[11px] font-bold bg-rose-50 border border-rose-100 text-rose-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Hot Case
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[...cases]
                .sort((a, b) => {
                  const likesA = a.likes?.length ?? 0;
                  const likesB = b.likes?.length ?? 0;
                  if (likesB !== likesA) return likesB - likesA;
                  return (b.views ?? 0) - (a.views ?? 0);
                })
                .slice(0, 4)
                .map((v, index) => (
                  <div key={v.id} className="relative group">
                    {/* Rank Badge */}
                    <div className={`absolute -top-2.5 -left-2.5 z-10 w-7.5 h-7.5 rounded-full border-2 border-white text-white font-extrabold text-xs flex items-center justify-center shadow-md select-none ${
                      index === 0 ? 'bg-amber-500' :
                      index === 1 ? 'bg-slate-400' :
                      index === 2 ? 'bg-amber-700' : 'bg-slate-800'
                    }`}>
                      {index + 1}
                    </div>
                    <VideoCard video={v} onClick={handleVideoClick} />
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
          <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
            {activeCategory === '전체' ? '최근 업로드된 케이스' : `${activeCategory} 최신 케이스`}
            {!loadingCases && (
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded font-semibold">
                {cases.length}건
              </span>
            )}
          </p>
        </div>

        {loadingCases ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
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
            <p className="text-base font-semibold text-slate-600">아직 케이스가 없습니다</p>
            <p className="text-sm mt-1 text-slate-400">첫 번째 케이스를 업로드해 주세요</p>
            {isApproved && (
              <button
                onClick={() => router.push('/upload')}
                className="btn-primary mt-5 text-sm px-5 py-2.5"
              >
                케이스 업로드
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {cases.map(v => (
              <VideoCard key={v.id} video={v} onClick={handleVideoClick} />
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
