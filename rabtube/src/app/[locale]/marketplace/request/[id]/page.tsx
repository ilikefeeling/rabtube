'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Coins, Clock, Users, Tag, Package,
  CheckCircle, Send, User, Truck, MessageSquare,
  AlertCircle, Award, FileText,
} from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/lib/AuthContext';
import { usePoints } from '@/hooks/usePoints';

const fmt = (n: number) => n.toLocaleString();

/* ── 카테고리 라벨 ── */
const CATEGORY_LABELS: Record<string, string> = {
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

/* ── 상태 스타일 ── */
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  open:     { bg: 'bg-teal-50',   text: 'text-teal-700',  label: '모집 중',   icon: <Users size={12} /> },
  closed:   { bg: 'bg-slate-100', text: 'text-slate-500', label: '마감',      icon: <Clock size={12} /> },
  selected: { bg: 'bg-amber-50',  text: 'text-amber-700', label: '채택 완료', icon: <Award size={12} /> },
};

/* ── 타입 ── */
interface RequestDetail {
  id: string;
  title: string;
  category: string;
  description: string;
  specs: { brand?: string; modelNumber?: string; quantity?: number; unit?: string };
  bountyRab: number;
  status: 'open' | 'closed' | 'selected';
  deadline: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  proposalCount: number;
}

interface Proposal {
  id: string;
  proposerId: string;
  proposerName: string;
  productName: string;
  brand: string;
  modelNumber: string;
  description: string;
  priceRab: number;
  priceCash: number;
  deliveryDays: number;
  message: string;
  selected: boolean;
  createdAt: string;
}

export default function RequestDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const requestId = params?.id as string;
  const { balance } = usePoints();

  const [request, setRequest]       = useState<RequestDetail | null>(null);
  const [proposals, setProposals]   = useState<Proposal[]>([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState('');
  const [actionLoading, setActionLoading] = useState('');

  // 제안 등록 폼
  const [productName, setProductName]   = useState('');
  const [pBrand, setPBrand]             = useState('');
  const [pModelNumber, setPModelNumber] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [priceRab, setPriceRab]         = useState('');
  const [priceCash, setPriceCash]       = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [message, setMessage]           = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !requestId) return;
    loadRequestDetail();
  }, [user, requestId]);

  const loadRequestDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/marketplace/requests/${requestId}`);
      if (res.ok) {
        const data = await res.json();
        setRequest(data.request);
        setProposals(data.proposals ?? []);
      } else {
        showToast('❌ 의뢰를 불러올 수 없습니다');
      }
    } catch (e) {
      console.error('Failed to load request:', e);
      showToast('❌ 네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const isOwner = request?.authorId === user?.uid;

  const handleSelectProposal = async (proposalId: string) => {
    if (!user || !requestId) return;
    if (!confirm('이 제안을 채택하시겠습니까? 바운티 RAB가 제안자에게 지급됩니다.')) return;

    setActionLoading(proposalId);
    try {
      const res = await fetch(`/api/marketplace/requests/${requestId}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, userId: user.uid }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || '채택에 실패했습니다');
      }
      showToast('✅ 제안이 채택되었습니다!');
      loadRequestDetail();
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setActionLoading('');
    }
  };

  const handleSubmitProposal = async () => {
    if (!user || !requestId) return;
    if (!productName.trim()) { showToast('❌ 상품명을 입력해 주세요'); return; }
    if (!priceRab && !priceCash) { showToast('❌ 가격을 입력해 주세요'); return; }
    if (!deliveryDays) { showToast('❌ 배송 예상일을 입력해 주세요'); return; }

    setSubmittingProposal(true);
    try {
      const res = await fetch(`/api/marketplace/requests/${requestId}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          productName: productName.trim(),
          brand: pBrand.trim(),
          modelNumber: pModelNumber.trim(),
          description: pDescription.trim(),
          priceRab: parseInt(priceRab) || 0,
          priceCash: parseInt(priceCash) || 0,
          deliveryDays: parseInt(deliveryDays) || 0,
          message: message.trim(),
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || '제안 등록에 실패했습니다');
      }
      showToast('✅ 제안이 등록되었습니다');
      // Reset form
      setProductName(''); setPBrand(''); setPModelNumber('');
      setPDescription(''); setPriceRab(''); setPriceCash('');
      setDeliveryDays(''); setMessage('');
      loadRequestDetail();
    } catch (e: any) {
      showToast(`❌ ${e.message}`);
    } finally {
      setSubmittingProposal(false);
    }
  };

  if (authLoading || loading || !user) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!request) return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <AlertCircle size={48} className="mb-4 text-slate-300" />
        <p className="text-sm font-medium text-slate-500">의뢰를 찾을 수 없습니다</p>
        <Link href="/marketplace" className="text-xs text-teal-600 hover:underline mt-2">마켓플레이스로 돌아가기</Link>
      </div>
    </div>
  );

  const status = STATUS_STYLES[request.status] ?? STATUS_STYLES.open;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Back link */}
        <Link href="/marketplace" className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-5 transition-colors">
          <ChevronLeft size={14} />마켓플레이스로 돌아가기
        </Link>

        {/* ── 의뢰 정보 카드 ── */}
        <div className="card p-6 mb-5">
          {/* Status + Category */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
              {status.icon}
              {status.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              <Tag size={10} />
              {CATEGORY_LABELS[request.category] ?? request.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-lg font-semibold text-slate-800 mb-3">{request.title}</h1>

          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line mb-4">{request.description}</p>

          {/* Specs */}
          {(request.specs.brand || request.specs.modelNumber || request.specs.quantity) && (
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Package size={10} />규격 정보
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {request.specs.brand && (
                  <div>
                    <p className="text-slate-400">브랜드</p>
                    <p className="font-medium text-slate-700">{request.specs.brand}</p>
                  </div>
                )}
                {request.specs.modelNumber && (
                  <div>
                    <p className="text-slate-400">모델번호</p>
                    <p className="font-medium text-slate-700">{request.specs.modelNumber}</p>
                  </div>
                )}
                {request.specs.quantity && (
                  <div>
                    <p className="text-slate-400">수량</p>
                    <p className="font-medium text-slate-700">{request.specs.quantity} {request.specs.unit ?? '개'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1 text-amber-600 font-semibold text-sm">
              <Coins size={14} />
              {fmt(request.bountyRab)} RAB
            </span>
            <span className="flex items-center gap-1">
              <Users size={13} />
              제안 {request.proposalCount}건
            </span>
            <span className="flex items-center gap-1">
              <Clock size={13} />
              마감 {request.deadline}
            </span>
            <span className="flex items-center gap-1">
              <User size={13} />
              {request.authorName}
            </span>
          </div>
        </div>

        {/* ── 제안 목록 ── */}
        <div className="mb-5">
          <h2 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
            <FileText size={14} className="text-teal-600" />
            제안 목록
            <span className="text-xs font-normal text-slate-400">({proposals.length}건)</span>
          </h2>

          {proposals.length === 0 ? (
            <div className="card p-8 text-center">
              <MessageSquare size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-500">아직 제안이 없습니다</p>
              <p className="text-xs text-slate-400 mt-1">첫 번째로 제안을 등록해 보세요!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.map(p => (
                <div
                  key={p.id}
                  className={`card p-5 transition-all ${
                    p.selected ? 'border-teal-200 bg-teal-50/30 ring-1 ring-teal-100' : ''
                  }`}
                >
                  {/* Selected badge */}
                  {p.selected && (
                    <div className="flex items-center gap-1.5 text-teal-600 text-xs font-semibold mb-3">
                      <CheckCircle size={14} />
                      채택된 제안
                    </div>
                  )}

                  {/* Proposer info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                        {p.proposerName?.charAt(0) ?? '?'}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700">{p.proposerName}</p>
                        <p className="text-[10px] text-slate-400">{p.createdAt}</p>
                      </div>
                    </div>
                  </div>

                  {/* Product info */}
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-slate-800">{p.productName}</h3>
                    {(p.brand || p.modelNumber) && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {[p.brand, p.modelNumber].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {p.description && (
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">{p.description}</p>
                    )}
                  </div>

                  {/* Price & Delivery */}
                  <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
                    {p.priceRab > 0 && (
                      <span className="flex items-center gap-1 bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-lg">
                        <Coins size={12} />
                        {fmt(p.priceRab)} RAB
                      </span>
                    )}
                    {p.priceCash > 0 && (
                      <span className="flex items-center gap-1 bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg">
                        ₩{fmt(p.priceCash)}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-slate-500">
                      <Truck size={12} />
                      배송 {p.deliveryDays}일
                    </span>
                  </div>

                  {/* Message */}
                  {p.message && (
                    <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 italic">
                      <MessageSquare size={10} className="inline mr-1 text-slate-400" />
                      {p.message}
                    </div>
                  )}

                  {/* Accept button (owner only, open status) */}
                  {isOwner && request.status === 'open' && !p.selected && (
                    <button
                      onClick={() => handleSelectProposal(p.id)}
                      disabled={!!actionLoading}
                      className="mt-3 w-full py-2 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === p.id ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          처리 중...
                        </>
                      ) : (
                        <>
                          <Award size={14} />
                          이 제안 채택하기
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 제안 등록 폼 (의뢰자가 아닌 경우, open 상태) ── */}
        {!isOwner && request.status === 'open' && (
          <div className="card p-5">
            <h2 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-1.5">
              <Send size={14} className="text-teal-600" />
              제안 등록
            </h2>

            <div className="space-y-3">
              {/* Product Name */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-1.5">상품명 *</label>
                <input
                  className="input-field"
                  placeholder="예) 오스템 TS III SA 임플란트 픽스쳐"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-1.5">브랜드</label>
                  <input
                    className="input-field"
                    placeholder="브랜드명"
                    value={pBrand}
                    onChange={e => setPBrand(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-1.5">모델번호</label>
                  <input
                    className="input-field"
                    placeholder="모델번호"
                    value={pModelNumber}
                    onChange={e => setPModelNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-1.5">상품 설명</label>
                <textarea
                  className="input-field min-h-[80px] resize-y"
                  placeholder="상품에 대한 상세 설명"
                  value={pDescription}
                  onChange={e => setPDescription(e.target.value)}
                />
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-1.5">가격 (RAB)</label>
                  <input
                    className="input-field"
                    type="number"
                    placeholder="RAB 가격"
                    value={priceRab}
                    onChange={e => setPriceRab(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-1.5">가격 (현금, ₩)</label>
                  <input
                    className="input-field"
                    type="number"
                    placeholder="현금 가격"
                    value={priceCash}
                    onChange={e => setPriceCash(e.target.value)}
                  />
                </div>
              </div>

              {/* Delivery */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-1.5">배송 예상일 (영업일 기준) *</label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="예) 3"
                  value={deliveryDays}
                  onChange={e => setDeliveryDays(e.target.value)}
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-1.5">메시지</label>
                <textarea
                  className="input-field min-h-[60px] resize-y"
                  placeholder="의뢰자에게 전달할 메시지 (선택)"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmitProposal}
                disabled={submittingProposal || !productName.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {submittingProposal ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    등록 중...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    제안 등록하기
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Owner notice when open */}
        {isOwner && request.status === 'open' && (
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={16} className="text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-teal-800">내가 등록한 의뢰입니다</p>
              <p className="text-xs text-teal-600 mt-0.5">제안이 등록되면 원하는 제안을 채택할 수 있습니다.</p>
            </div>
          </div>
        )}

        {/* Closed / Selected notice */}
        {request.status !== 'open' && (
          <div className="bg-slate-100 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={16} className="text-slate-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-700">
                {request.status === 'selected' ? '이 의뢰는 채택이 완료되었습니다' : '이 의뢰는 마감되었습니다'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">더 이상 새로운 제안을 등록할 수 없습니다.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
