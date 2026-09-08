'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { adminAdjustPoints } from '@/lib/adminService';
import { useAuth } from '@/lib/AuthContext';
import type { MemberWithBalance } from '@/lib/adminService';

interface Props {
  member: MemberWithBalance;
  onClose: () => void;
  onDone: () => void;
}

export default function AdjustModal({ member, onClose, onDone }: Props) {
  const { user } = useAuth();
  const [amount, setAmount]   = useState('');
  const [reason, setReason]   = useState('');
  const [type, setType]       = useState<'grant' | 'deduct'>('grant');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<'success' | 'error' | null>(null);
  const [errMsg, setErrMsg]   = useState('');

  const parsedAmount = parseInt(amount) || 0;
  const finalAmount  = type === 'grant' ? parsedAmount : -parsedAmount;
  const afterBalance = member.balance + finalAmount;

  const handleSubmit = async () => {
    if (!user || parsedAmount <= 0 || !reason.trim()) return;
    if (type === 'deduct' && afterBalance < 0) return;

    setLoading(true);
    setResult(null);
    try {
      await adminAdjustPoints({
        targetUserId: member.uid,
        amount: finalAmount,
        reason,
        adminUserId: user.uid,
      });
      setResult('success');
      setTimeout(() => { onDone(); onClose(); }, 1200);
    } catch (e: any) {
      setErrMsg(e.message ?? '오류 발생');
      setResult('error');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString();

  const PRESETS = {
    grant:  [10, 50, 100, 500],
    deduct: [5,  10, 50,  100],
  };

  const REASONS = {
    grant:  ['이벤트 보상', '운영자 사례', '오류 보정', '베타 참여 보상'],
    deduct: ['불량 케이스 패널티', '어뷰징 제재', '환불 처리', '오류 보정'],
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0d2137] px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">RAB 수동 조정</p>
            <p className="text-slate-400 text-xs mt-0.5">{member.name} 원장 · {member.hospital}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        <div className="p-5">
          {/* Current balance */}
          <div className="bg-slate-50 rounded-xl p-3 mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">현재 잔액</p>
              <p className="text-xl font-medium text-slate-800">{fmt(member.balance)} <span className="text-xs font-bold text-amber-500">RAB</span></p>
            </div>
            {parsedAmount > 0 && (
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">조정 후</p>
                <p className={`text-xl font-medium ${afterBalance < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                  {fmt(afterBalance)} <span className="text-xs font-bold text-amber-500">RAB</span>
                </p>
              </div>
            )}
          </div>

          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {(['grant', 'deduct'] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  type === t
                    ? t === 'grant'
                      ? 'bg-teal-50 border-teal-300 text-teal-700'
                      : 'bg-red-50 border-red-300 text-red-600'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                {t === 'grant' ? '+ 지급' : '− 차감'}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="mb-4">
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-1.5">금액 (RAB)</label>
            <input
              type="number"
              min={1}
              className="input-field"
              placeholder="조정할 RAB 수량"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            {/* Presets */}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {PRESETS[type].map(p => (
                <button
                  key={p}
                  onClick={() => setAmount(String(p))}
                  className="text-[11px] px-2.5 py-1 rounded-md border border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="mb-5">
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-1.5">사유</label>
            <input
              className="input-field"
              placeholder="조정 사유를 입력해 주세요"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {REASONS[type].map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className="text-[11px] px-2.5 py-1 rounded-md border border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600 transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Result feedback */}
          {result === 'success' && (
            <div className="flex items-center gap-2 bg-teal-50 text-teal-700 text-sm p-3 rounded-lg mb-4">
              <CheckCircle size={14} />조정 완료
            </div>
          )}
          {result === 'error' && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
              <AlertCircle size={14} />{errMsg}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary flex-1">취소</button>
            <button
              onClick={handleSubmit}
              disabled={loading || parsedAmount <= 0 || !reason.trim() || afterBalance < 0}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${
                type === 'grant'
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {loading ? '처리 중...' : type === 'grant' ? `+${parsedAmount} RAB 지급` : `-${parsedAmount} RAB 차감`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
