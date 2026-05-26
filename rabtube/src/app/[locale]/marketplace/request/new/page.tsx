'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, ImagePlus, Send, Coins, AlertCircle,
  Package, Tag, FileText, Calendar, X,
} from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/lib/AuthContext';
import { usePoints } from '@/hooks/usePoints';

/* ── 카테고리 목록 ── */
const CATEGORIES = [
  { value: '임플란트_부속',  label: '임플란트 부속' },
  { value: '레진_수복재료',  label: '레진·수복재료' },
  { value: '인상재_석고',    label: '인상재·석고' },
  { value: '근관치료재료',   label: '근관치료재료' },
  { value: '교정재료',       label: '교정재료' },
  { value: '예방치과재료',   label: '예방치과재료' },
  { value: '소독_위생용품',  label: '소독·위생용품' },
  { value: '진료실_소모품',  label: '진료실 소모품' },
  { value: '수술용품',       label: '수술용품' },
  { value: '보철재료',       label: '보철재료' },
  { value: '디지털장비_부속', label: '디지털장비 부속' },
  { value: '병원_운영용품',  label: '병원 운영용품' },
  { value: '기타',           label: '기타' },
];

const DEADLINES = [
  { value: 7,  label: '7일' },
  { value: 14, label: '14일' },
  { value: 30, label: '30일' },
];

const fmt = (n: number) => n.toLocaleString();

export default function NewRequestPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { balance } = usePoints();

  const [category, setCategory]       = useState('');
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand]             = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [quantity, setQuantity]       = useState('');
  const [unit, setUnit]               = useState('개');
  const [bountyRab, setBountyRab]     = useState(500);
  const [deadlineDays, setDeadlineDays] = useState(14);
  const [images, setImages]           = useState<string[]>([]);
  const [submitting, setSubmitting]   = useState(false);
  const [toast, setToast]             = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleImagePlaceholder = () => {
    showToast('📸 이미지 첨부 기능은 곧 제공됩니다');
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!category) { showToast('❌ 카테고리를 선택해 주세요'); return; }
    if (!title.trim()) { showToast('❌ 제목을 입력해 주세요'); return; }
    if (!description.trim()) { showToast('❌ 상세 설명을 입력해 주세요'); return; }
    if (bountyRab > (balance?.balance ?? 0)) { showToast('❌ RAB 잔액이 부족합니다'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/marketplace/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: user.uid,
          category,
          title: title.trim(),
          description: description.trim(),
          specifications: [brand, modelNumber].filter(Boolean).join(' / '),
          quantity: parseInt(quantity) || 1,
          unit,
          bountyRab,
          expiresInDays: deadlineDays,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || '등록에 실패했습니다');
      }
      showToast('✅ 의뢰가 등록되었습니다');
      setTimeout(() => router.push('/marketplace'), 1200);
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Back link */}
        <Link href="/marketplace" className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-5 transition-colors">
          <ChevronLeft size={14} />마켓플레이스로 돌아가기
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-medium text-slate-800 flex items-center gap-2">
              <FileText size={20} className="text-teal-600" />
              의뢰 등록
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">필요한 재료·장비를 공급사에게 의뢰하세요</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-right">
            <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">내 RAB 잔액</p>
            <p className="text-lg font-medium text-amber-700">{fmt(balance?.balance ?? 0)} <span className="text-xs font-bold">RAB</span></p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Category */}
          <div className="card p-5">
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-2">
              <span className="flex items-center gap-1"><Tag size={12} />카테고리</span>
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="input-field"
            >
              <option value="">카테고리를 선택하세요</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="card p-5">
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-2">제목</label>
            <input
              className="input-field"
              type="text"
              placeholder="예) 오스템 TS III SA 임플란트 픽스쳐 100개 구매 의뢰"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-[10px] text-slate-300 text-right mt-1">{title.length}/100</p>
          </div>

          {/* Description */}
          <div className="card p-5">
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-2">상세 설명</label>
            <textarea
              className="input-field min-h-[120px] resize-y"
              placeholder="필요한 재료/장비에 대해 상세히 설명해 주세요.&#10;(규격, 용도, 선호 브랜드, 수량 등)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={2000}
            />
            <p className="text-[10px] text-slate-300 text-right mt-1">{description.length}/2000</p>
          </div>

          {/* Specs */}
          <div className="card p-5">
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-3">
              <span className="flex items-center gap-1"><Package size={12} />규격 정보</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">브랜드</label>
                <input
                  className="input-field"
                  placeholder="예) 오스템"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">모델번호</label>
                <input
                  className="input-field"
                  placeholder="예) TS III SA"
                  value={modelNumber}
                  onChange={e => setModelNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">수량</label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="100"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">단위</label>
                <select
                  className="input-field"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                >
                  <option value="개">개</option>
                  <option value="박스">박스</option>
                  <option value="세트">세트</option>
                  <option value="팩">팩</option>
                  <option value="EA">EA</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bounty RAB */}
          <div className="card p-5">
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-3">
              <span className="flex items-center gap-1"><Coins size={12} />바운티 RAB 설정</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">채택된 제안자에게 지급할 바운티입니다</p>

            <div className="flex items-center gap-4 mb-3">
              <input
                type="range"
                min={100}
                max={10000}
                step={100}
                value={bountyRab}
                onChange={e => setBountyRab(Number(e.target.value))}
                className="flex-1 accent-teal-600 h-2"
              />
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 min-w-[100px] text-center">
                <input
                  type="number"
                  min={100}
                  max={10000}
                  step={100}
                  value={bountyRab}
                  onChange={e => {
                    const v = Math.min(10000, Math.max(100, Number(e.target.value)));
                    setBountyRab(v);
                  }}
                  className="w-full bg-transparent text-center text-lg font-bold text-amber-700 outline-none"
                />
                <p className="text-[9px] text-amber-500 font-bold">RAB</p>
              </div>
            </div>

            {bountyRab > (balance?.balance ?? 0) && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg p-2.5 text-xs text-red-600">
                <AlertCircle size={14} className="shrink-0" />
                <span>잔액이 부족합니다. <Link href="/billing" className="underline font-semibold">RAB 충전하기</Link></span>
              </div>
            )}
          </div>

          {/* Deadline */}
          <div className="card p-5">
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-3">
              <span className="flex items-center gap-1"><Calendar size={12} />마감 기간</span>
            </label>
            <div className="flex gap-2">
              {DEADLINES.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDeadlineDays(d.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    deadlineDays === d.value
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              마감일: {new Date(Date.now() + deadlineDays * 86400000).toLocaleDateString('ko-KR')}
            </p>
          </div>

          {/* Image Upload */}
          <div className="card p-5">
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-3">
              <span className="flex items-center gap-1"><ImagePlus size={12} />이미지 첨부 (선택)</span>
            </label>
            <button
              onClick={handleImagePlaceholder}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl py-8 flex flex-col items-center gap-2 text-slate-400 hover:border-teal-300 hover:text-teal-500 transition-all"
            >
              <ImagePlus size={24} />
              <span className="text-xs font-medium">이미지를 추가하세요</span>
              <span className="text-[10px]">PNG, JPG (최대 5MB)</span>
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !category || !title.trim() || bountyRab > (balance?.balance ?? 0)}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                등록 중...
              </>
            ) : (
              <>
                <Send size={16} />
                의뢰 등록하기 ({fmt(bountyRab)} RAB)
              </>
            )}
          </button>

          {/* Info */}
          <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-1">
            <p>• 의뢰 등록 시 바운티 RAB가 에스크로로 차감됩니다</p>
            <p>• 제안이 채택되면 바운티가 공급사에게 지급됩니다</p>
            <p>• 마감 시까지 채택이 없으면 RAB가 환불됩니다</p>
          </div>
        </div>
      </main>
    </div>
  );
}
