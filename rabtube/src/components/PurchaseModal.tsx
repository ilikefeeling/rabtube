'use client';

import { useState } from 'react';
import { X, Coins } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { calculateBilling, MIN_RAB, MAX_RAB } from '@/lib/billingService';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PurchaseModal({ onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [rabAmount, setRabAmount] = useState<number>(MIN_RAB);
  const [isProcessing, setIsProcessing] = useState(false);

  // 실시간 과금 계산
  const billing = calculateBilling(rabAmount);

  const handlePurchase = async () => {
    if (!user) return;
    if (rabAmount < MIN_RAB || rabAmount > MAX_RAB) {
      alert(`구매 수량은 최소 ${MIN_RAB.toLocaleString()} RAB 부터 최대 ${MAX_RAB.toLocaleString()} RAB 까지 가능합니다.`);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/stripe/rab-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          rabAmount: rabAmount,
          email: user.email || '',
        }),
      });

      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || '결제 요청 실패');
      }

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

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setRabAmount(val);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = Number(e.target.value);
    if (isNaN(val)) return;
    setRabAmount(val);
  };

  const handleInputBlur = () => {
    if (rabAmount < MIN_RAB) setRabAmount(MIN_RAB);
    if (rabAmount > MAX_RAB) setRabAmount(MAX_RAB);
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
          <label className="block text-xs font-medium text-slate-500 mb-2">충전할 RAB 수량 (최소 {MIN_RAB.toLocaleString()} RAB / $10)</label>
          
          <div className="relative mb-4">
            <input
              type="number"
              min={MIN_RAB}
              max={MAX_RAB}
              value={rabAmount}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              disabled={isProcessing}
              className="input-field w-full pr-12 text-lg font-bold text-center"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">
              RAB
            </span>
          </div>

          <div className="mb-6 px-1">
            <input
              type="range"
              min={MIN_RAB}
              max={MAX_RAB}
              step={10}
              value={rabAmount}
              onChange={handleSliderChange}
              disabled={isProcessing}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
              <span>{MIN_RAB.toLocaleString()} RAB</span>
              <span>{MAX_RAB.toLocaleString()} RAB</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100/60 rounded-xl p-4 mb-6 text-center">
            <p className="text-[11px] text-amber-600 font-medium mb-1">총 결제 금액 (USD)</p>
            <p className="text-3xl font-bold text-amber-700">${billing.price.toFixed(2)}</p>
            <p className="text-[10px] text-amber-500 mt-1.5 font-medium">
              대량 구매 보너스(할인율): <span className="font-bold">{billing.rate}%</span> 적용
            </p>
          </div>

          <button
            onClick={handlePurchase}
            disabled={isProcessing || rabAmount < MIN_RAB}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm py-3 rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Stripe 안전 결제창으로 이동 중...
              </>
            ) : (
              `$${billing.price.toFixed(2)} USD 결제하기`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

