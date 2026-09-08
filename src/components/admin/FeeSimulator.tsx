'use client';

import React, { useState } from 'react';
import { Calculator, TrendingUp, ArrowRight } from 'lucide-react';

export default function FeeSimulator() {
  const [uploadCount, setUploadCount] = useState(10);
  const [viewCount, setViewCount] = useState(100);
  const [viewPrice, setViewPrice] = useState(180);
  const [uploadReward, setUploadReward] = useState(25);
  const [uploadCharge, setUploadCharge] = useState(0);
  const [feeRate, setFeeRate] = useState(20);

  // 크리에이터 관점
  const creatorViewRevenue = Math.floor(uploadCount * viewCount * viewPrice * (1 - feeRate / 100));
  const creatorTotalNet = uploadReward - uploadCharge + creatorViewRevenue;

  // 플랫폼 관점
  const platformViewRevenue = Math.floor(uploadCount * viewCount * viewPrice * (feeRate / 100));
  const platformTotalNet = uploadCharge - uploadReward + platformViewRevenue;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 입력부 */}
      <div className="card p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
        <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Calculator size={18} className="text-teal-600" />
          시뮬레이션 변수 설정
        </h3>
        
        <div className="space-y-5">
          <div>
            <label className="flex justify-between text-sm font-semibold text-slate-600 mb-2">
              <span>월 업로드 수 (건)</span>
              <span className="text-teal-600">{uploadCount.toLocaleString()}건</span>
            </label>
            <input type="range" min="1" max="100" value={uploadCount} onChange={e => setUploadCount(Number(e.target.value))} className="w-full accent-teal-500" />
          </div>
          
          <div>
            <label className="flex justify-between text-sm font-semibold text-slate-600 mb-2">
              <span>월평균 시청수 (회/건)</span>
              <span className="text-teal-600">{viewCount.toLocaleString()}회</span>
            </label>
            <input type="range" min="10" max="1000" step="10" value={viewCount} onChange={e => setViewCount(Number(e.target.value))} className="w-full accent-teal-500" />
          </div>

          <div>
            <label className="flex justify-between text-sm font-semibold text-slate-600 mb-2">
              <span>열람 가격 설정 (RAB)</span>
              <span className="text-teal-600">{viewPrice.toLocaleString()} RAB</span>
            </label>
            <input type="range" min="10" max="1000" step="10" value={viewPrice} onChange={e => setViewPrice(Number(e.target.value))} className="w-full accent-teal-500" />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="flex justify-between text-sm font-semibold text-slate-600 mb-2">
              <span>시청 수수료율 (%)</span>
              <span className="text-rose-500">{feeRate}%</span>
            </label>
            <input type="range" min="0" max="100" value={feeRate} onChange={e => setFeeRate(Number(e.target.value))} className="w-full accent-rose-500" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">기본 업로드 보상 (RAB)</label>
              <input type="number" value={uploadReward} onChange={e => setUploadReward(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">1회성 업로드 과금 (RAB)</label>
              <input type="number" value={uploadCharge} onChange={e => setUploadCharge(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 출력부 */}
      <div className="space-y-6">
        {/* 플랫폼 관점 */}
        <div className="card p-6 bg-slate-800 text-white border-0 shadow-lg rounded-2xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 text-slate-700/30">
            <TrendingUp size={120} />
          </div>
          <h3 className="text-base font-bold text-teal-400 mb-4 relative z-10">운영자(플랫폼) 재무 산출</h3>
          <div className="space-y-3 relative z-10 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-300">플랫폼 시청 수수료 수익 (입금)</span>
              <span className="font-semibold text-teal-300">+{platformViewRevenue.toLocaleString()} RAB</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-300">업로드 과금 수익 (입금)</span>
              <span className="font-semibold text-teal-300">+{uploadCharge.toLocaleString()} RAB</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-700 pb-3">
              <span className="text-slate-300">업로드 보상 지출 (출금)</span>
              <span className="font-semibold text-rose-400">-{uploadReward.toLocaleString()} RAB</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-slate-100">월간 플랫폼 예상 순수익</span>
              <span className={`text-lg font-bold ${platformTotalNet >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                {platformTotalNet >= 0 ? '+' : ''}{platformTotalNet.toLocaleString()} RAB
              </span>
            </div>
          </div>
        </div>

        {/* 크리에이터 관점 요약 */}
        <div className="card p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <ArrowRight size={16} className="text-slate-400" />
            크리에이터 예상 수익 구조 (참고용)
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">누적 업로드 보상</span>
              <span className="font-medium text-teal-600">+{uploadReward.toLocaleString()} RAB</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">1회성 업로드 과금</span>
              <span className="font-medium text-rose-500">-{uploadCharge.toLocaleString()} RAB</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">월 시청 누적 수익 (수수료 {feeRate}% 제외)</span>
              <span className="font-medium text-teal-600">+{creatorViewRevenue.toLocaleString()} RAB</span>
            </div>
            <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-100">
              <span className="font-bold text-slate-700">크리에이터 월간 예상 수익</span>
              <span className="font-bold text-teal-600">+{creatorTotalNet.toLocaleString()} RAB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
