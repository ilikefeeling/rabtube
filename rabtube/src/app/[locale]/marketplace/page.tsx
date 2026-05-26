'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Search, Filter, Plus, Clock, Users,
  Coins, Tag, ShoppingBag, FileText, PackageSearch,
  AlertCircle, ArrowRight, Store,
} from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/lib/AuthContext';
import { usePoints } from '@/hooks/usePoints';

/* ── 카테고리 목록 ── */
const CATEGORIES = [
  '전체', '임플란트_부속', '레진_수복재료', '인상재_석고',
  '근관치료재료', '교정재료', '예방치과재료', '소독_위생용품',
  '진료실_소모품', '수술용품', '보철재료', '디지털장비_부속',
  '병원_운영용품', '기타',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  '전체': '전체',
  '임플란트_부속': '임플란트 부속',
  '레진_수복재료': '레진·수복재료',
  '인상재_석고': '인상재·석고',
  '근관치료재료': '근관치료재료',
  '교정재료': '교정재료',
  '예방치과재료': '예방치과재료',
  '소독_위생용품': '소독·위생용품',
  '진료실_소모품': '진료실 소모품',
  '수술용품': '수술용품',
  '보철재료': '보철재료',
  '디지털장비_부속': '디지털장비 부속',
  '병원_운영용품': '병원 운영용품',
  '기타': '기타',
};

/* ── 상태 배지 색상 ── */
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  open:     { bg: 'bg-teal-50',  text: 'text-teal-700',  label: '모집 중' },
  closed:   { bg: 'bg-slate-100', text: 'text-slate-500', label: '마감' },
  selected: { bg: 'bg-amber-50', text: 'text-amber-700', label: '채택 완료' },
};

/* ── 의뢰 타입 ── */
interface MarketplaceRequest {
  id: string;
  title: string;
  category: string;
  bountyRab: number;
  proposalCount: number;
  deadline: string;
  status: 'open' | 'closed' | 'selected';
  authorName: string;
  createdAt: string;
}

const fmt = (n: number) => n.toLocaleString();

export default function MarketplacePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { balance } = usePoints();

  const [tab, setTab] = useState<'requests' | 'shop'>('requests');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [requests, setRequests] = useState<MarketplaceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    loadRequests();
  }, [user, activeCategory]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== '전체') params.set('category', activeCategory);
      const res = await fetch(`/api/marketplace/requests?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.data ?? data.requests ?? []);
      }
    } catch (e) {
      console.error('Failed to load requests:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = searchQuery
    ? requests.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : requests;

  if (authLoading || !user) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <Link href="/" className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-5 transition-colors">
          <ChevronLeft size={14} />피드로 돌아가기
        </Link>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-lg font-medium text-slate-800 flex items-center gap-2">
              <Store size={20} className="text-teal-600" />
              마켓플레이스
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">치과 재료·장비 공동구매 의뢰 및 쇼핑</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-right">
            <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">내 RAB 잔액</p>
            <p className="text-xl font-medium text-amber-700">{fmt(balance?.balance ?? 0)} <span className="text-xs font-bold">RAB</span></p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {[
            { id: 'requests', label: '의뢰 목록', icon: <FileText size={14} /> },
            { id: 'shop',     label: '쇼핑몰',   icon: <ShoppingBag size={14} /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── 의뢰 목록 탭 ── */}
        {tab === 'requests' && (
          <div>
            {/* Search Bar */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 gap-2 focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-100 transition-all">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="의뢰 검색..."
                  className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-300"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-3 mb-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-600'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {/* Request Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card p-5 animate-pulse">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-5 bg-slate-200 rounded w-14" />
                    </div>
                    <div className="h-3 bg-slate-100 rounded w-1/2 mb-3" />
                    <div className="flex items-center gap-3">
                      <div className="h-3 bg-slate-100 rounded w-20" />
                      <div className="h-3 bg-slate-100 rounded w-16" />
                      <div className="h-3 bg-slate-100 rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <PackageSearch size={48} className="mb-4 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">등록된 의뢰가 없습니다</p>
                <p className="text-xs mt-1 text-slate-400">첫 번째 의뢰를 등록해 보세요!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredRequests.map(req => {
                  const status = STATUS_STYLES[req.status] ?? STATUS_STYLES.open;
                  return (
                    <Link
                      key={req.id}
                      href={`/marketplace/request/${req.id}`}
                      className="card p-5 hover:border-teal-200 hover:shadow-md transition-all group cursor-pointer"
                    >
                      {/* Top: title + status */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-teal-700 transition-colors">
                          {req.title}
                        </h3>
                        <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Category badge */}
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          <Tag size={10} />
                          {CATEGORY_LABELS[req.category] ?? req.category}
                        </span>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-amber-600 font-semibold">
                          <Coins size={12} />
                          {fmt(req.bountyRab)} RAB
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          제안 {req.proposalCount}건
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {req.deadline}
                        </span>
                      </div>

                      {/* Author */}
                      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">{req.authorName}</span>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 쇼핑몰 탭 ── */}
        {tab === 'shop' && (
          <div className="flex flex-col items-center justify-center py-16">
            {/* Coming Soon Card */}
            <div className="card p-8 max-w-md w-full text-center">
              <div className="w-16 h-16 mx-auto mb-5 bg-teal-50 rounded-2xl flex items-center justify-center">
                <ShoppingBag size={28} className="text-teal-500" />
              </div>
              <h2 className="text-base font-semibold text-slate-800 mb-2">쇼핑몰 준비 중입니다</h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                치과 재료·장비 공급사를 위한 B2B 쇼핑몰이<br />
                곧 오픈됩니다. 입점 문의를 남겨주세요.
              </p>

              {/* Decoration dots */}
              <div className="flex items-center justify-center gap-1.5 mb-6">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-teal-300 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-teal-200 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>

              <a
                href="mailto:support@rabtube.com?subject=마켓플레이스 공급사 입점 문의"
                className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <Store size={14} />
                공급사 입점 문의
              </a>

              <div className="mt-6 bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-1 text-left">
                <p>• 공급사 등록 시 전국 치과 병·의원에 노출됩니다</p>
                <p>• 직접 배송 또는 RabTube 물류 연동 가능</p>
                <p>• 의뢰 공고에 직접 제안을 보낼 수 있습니다</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FAB: 의뢰 등록 버튼 (의뢰 목록 탭에서만) */}
      {tab === 'requests' && (
        <Link
          href="/marketplace/request/new"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-teal-600/25 hover:shadow-xl hover:shadow-teal-600/30 transition-all group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-200" />
          <span className="text-sm">의뢰 등록</span>
        </Link>
      )}
    </div>
  );
}
