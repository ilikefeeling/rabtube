'use client';

import { useState } from 'react';
import { X, Coins } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// 백엔드와 완전히 일치하는 보너스 RAB 패키지 정책
const RAB_PACKAGES: Record<number, { rab: number; label: string }> = {
  5000:   { rab: 500,   label: '기본 500 RAB (10% 보너스 상당)' },
  10000:  { rab: 1100,  label: '기본 + 10% 추가 보너스' },
  30000:  { rab: 3500,  label: '기본 + 16% 추가 보너스' },
  50000:  { rab: 6000,  label: '기본 + 20% 추가 보너스' },
  100000: { rab: 13000, label: '기본 + 30% 초고액 보너스' },
};

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PurchaseModal({ onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [amountKrw, setAmountKrw] = useState<number>(10000);
  const [isProcessing, setIsProcessing] = useState(false);

  const pkg = RAB_PACKAGES[amountKrw] || { rab: 0, label: '' };
  const rabAmount = pkg.rab;

  const handlePurchase = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      // 1. Stripe Checkout API 호출
      const res = await fetch('/api/stripe/rab-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          krwAmount: amountKrw,
          email: user.email || '',
        }),
      });

      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || '결제 요청 실패');
      }

      // 2. Stripe 결제 페이지(Checkout Session URL)로 안전하게 리다이렉트
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('결제 세션 URL이 전달되지 않았습니다.');
      }
    } catch (e: any) {
      console.error('[Stripe Purchase Click Error]', e);
      alert(`결제 요청 중 오류가 발생했습니다: ${e.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-800 flex items-center gap-2">
            <Coins size={16} className="text-amber-500" />
            RAB 충전하기
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <label className="block text-xs font-medium text-slate-500 mb-2">충전 금액 (원)</label>
          <select
            className="input-field w-full mb-4 cursor-pointer"
            value={amountKrw}
            onChange={e => setAmountKrw(Number(e.target.value))}
            disabled={isProcessing}
          >
            <option value={5000}>5,000원</option>
            <option value={10000}>10,000원</option>
            <option value={30000}>30,000원</option>
            <option value={50000}>50,000원</option>
            <option value={100000}>100,000원</option>
          </select>

          <div className="bg-amber-50 border border-amber-100/60 rounded-xl p-4 mb-6 text-center">
            <p className="text-[11px] text-amber-600 font-medium mb-1">지급 예정 RAB</p>
            <p className="text-2xl font-bold text-amber-700">{rabAmount.toLocaleString()} RAB</p>
            <p className="text-[10px] text-amber-500 mt-1.5 font-medium">{pkg.label}</p>
          </div>

          <button
            onClick={handlePurchase}
            disabled={isProcessing}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm py-3 rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Stripe 안전 결제창으로 이동 중...
              </>
            ) : (
              `${amountKrw.toLocaleString()}원 결제하기`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
