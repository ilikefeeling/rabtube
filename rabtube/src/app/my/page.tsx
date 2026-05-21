'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Eye, Heart, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import VideoPlayer from '@/components/VideoPlayer';
import { getMyCases, deleteCaseVideo } from '@/lib/firebaseService';
import { useAuth } from '@/lib/AuthContext';
import type { CaseVideo } from '@/types';

export default function MyCasesPage() {
  const { user, profile, loading: authLoading } = useAuth();
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
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-medium text-slate-800">내 케이스</h1>
            <p className="text-xs text-slate-400 mt-0.5">{profile?.name} 원장 · {profile?.hospital}</p>
          </div>
          <Link href="/upload" className="btn-primary flex items-center gap-1.5">
            <Plus size={14} />케이스 업로드
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cases.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="text-4xl mb-3">🦷</div>
            <p className="text-sm font-medium text-slate-500">아직 업로드한 케이스가 없습니다</p>
            <Link href="/upload" className="btn-primary inline-flex items-center gap-1.5 mt-4">
              <Plus size={14} />첫 케이스 업로드
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {cases.map(v => (
              <div key={v.id} className="card p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                <div
                  className="relative w-24 h-16 rounded-lg bg-[#0d2137] shrink-0 cursor-pointer overflow-hidden"
                  onClick={() => setSelected(v)}
                >
                  {v.thumbnailUrl && <Image src={v.thumbnailUrl} alt={v.title} fill className="object-cover opacity-80" sizes="96px" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{v.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span className="bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-[10px]">{v.category}</span>
                    <span>{v.toothNumber}</span>
                    <span>·</span>
                    <span>{v.visibility}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><Eye size={10} />{v.views}</span>
                    <span className="flex items-center gap-0.5"><Heart size={10} />{v.likes?.length ?? 0}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(v)}
                  className="shrink-0 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
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
