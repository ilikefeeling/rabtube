'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Eye, Heart, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import VideoPlayer from '@/components/VideoPlayer';
import LicenseGate from '@/components/LicenseGate';
import { getMyCases, deleteCaseVideo } from '@/lib/firebaseService';
import { useAuth } from '@/lib/AuthContext';
import type { CaseVideo } from '@/types';

export default function MyCasesPage() {
  const { user, profile, loading: authLoading, isApproved } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<CaseVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CaseVideo | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    getMyCases(user.uid).then(data => { setCases(data); setLoading(false); });
  }, [user]);

  const handleDelete = async (v: CaseVideo) => {
    if (!confirm(`"${v.title}" 케이스를 삭제하시겠습니까?`)) return;
    await deleteCaseVideo(v.id, v.videoUrl);
    setCases(c => c.filter(x => x.id !== v.id));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* 면허 인증 게이트 */}
      <LicenseGate />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">내 케이스</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">{profile?.name} 원장 · {profile?.hospital}</p>
          </div>
          {isApproved && (
            <Link href="/upload" className="btn-primary flex items-center gap-2 px-5 py-2.2 text-[15px] font-bold rounded-xl transition-all shadow-sm">
              <Plus size={16} />케이스 업로드
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cases.length === 0 ? (
          <div className="card p-20 text-center">
            <div className="text-5xl mb-4">🦷</div>
            <p className="text-base font-bold text-slate-600">아직 업로드한 케이스가 없습니다</p>
            {isApproved && (
              <Link href="/upload" className="btn-primary inline-flex items-center gap-2 px-5 py-2.2 text-[15px] font-bold mt-5 rounded-xl transition-all shadow-sm">
                <Plus size={16} />첫 케이스 업로드
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {cases.map(v => (
              <div key={v.id} className="card p-5 flex items-center gap-5 hover:shadow-md transition-all duration-200 border border-slate-100/50">
                <div
                  className="w-28 h-18 rounded-xl bg-[#0d2137] shrink-0 cursor-pointer overflow-hidden border border-slate-100/10 shadow-sm"
                  onClick={() => setSelected(v)}
                >
                  {v.thumbnailUrl && <img src={v.thumbnailUrl} className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-slate-900 truncate mb-1.5 cursor-pointer hover:text-teal-600 transition-colors" onClick={() => setSelected(v)}>
                    {v.title}
                  </p>
                  <div className="flex items-center gap-2.5 text-xs text-slate-500 font-semibold">
                    <span className="bg-slate-50 border border-slate-150 px-2 py-0.75 rounded-md text-[11px] font-extrabold text-slate-600">{v.category}</span>
                    <span className="text-slate-400 font-bold">·</span>
                    <span>{v.toothNumber}</span>
                    <span className="text-slate-400 font-bold">·</span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${v.visibility !== '비공개' ? 'bg-teal-50 text-teal-600 border border-teal-100/50' : 'bg-slate-100 text-slate-500'}`}>
                      {v.visibility}
                    </span>
                    <span className="text-slate-400 font-bold">·</span>
                    <span className="flex items-center gap-1"><Eye size={13} />{v.views}</span>
                    <span className="flex items-center gap-1"><Heart size={13} />{v.likes?.length ?? 0}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(v)}
                  className="shrink-0 w-9.5 h-9.5 flex items-center justify-center text-slate-350 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {selected && <VideoPlayer video={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
