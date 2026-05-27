'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DENTAL_CATEGORIES, DentalCategory } from '@/types';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { createProductRequest } from '@/lib/marketplaceService';
import { uploadGenericImage } from '@/lib/firebaseService';
import { ImagePlus, X } from 'lucide-react';

export default function NewProductRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [form, setForm] = useState({
    title: '',
    category: '' as DentalCategory | '',
    preferredBrand: '',
    preferredModel: '',
    quantity: 1,
    unit: '개',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('로그인이 필요합니다.');
    if (!form.title || !form.category || !form.description) {
      return alert('필수 항목을 모두 입력해주세요.');
    }
    if (form.quantity > 999) {
      return alert('예상 소요량은 최대 999개까지만 입력 가능합니다.');
    }

    setLoading(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadGenericImage(imageFile, 'product_requests');
      }

      // Direct client-side write to Firestore using client-side SDK (runs authenticated!)
      const reqId = await createProductRequest(user.uid, {
        ...form,
        imageUrl,
        category: form.category as DentalCategory
      });
      alert('상품등록 요청이 성공적으로 접수되었습니다.\n관리자 검토 후 쇼핑몰 입점이 추진됩니다.');
      router.push('/marketplace');
    } catch (error: any) {
      console.error(error);
      alert(error.message || '등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">상품등록 신청</h1>
        <Link href="/marketplace" className="text-sm text-gray-500 hover:text-gray-900">돌아가기</Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-gray-600 mb-6 pb-6 border-b">
          쇼핑몰에서 구매하고 싶은 치과 용품/재료를 신청해주세요.<br/>
          다른 원장님들의 공감이 많을수록 우선적으로 입점이 추진됩니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목 <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="예) 오스템 임플란트 픽스처 TS III SA 필요합니다"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              required
              spellCheck={false}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 <span className="text-red-500">*</span></label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value as DentalCategory})}
                required
              >
                <option value="">선택해주세요</option>
                {DENTAL_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">예상 소요량 / 월간 <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <input 
                  type="number" min="1" max="999"
                  className="w-2/3 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                  value={form.quantity}
                  onChange={e => {
                    let val = Number(e.target.value);
                    if (val > 999) val = 999;
                    setForm({...form, quantity: val});
                  }}
                  required
                />
                <select 
                  className="w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                  value={form.unit}
                  onChange={e => setForm({...form, unit: e.target.value})}
                >
                  <option value="개">개</option>
                  <option value="박스">박스</option>
                  <option value="세트">세트</option>
                  <option value="기타">기타</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">선호 브랜드 (선택)</label>
              <input 
                type="text" 
                placeholder="예) 오스템, 덴티움"
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                value={form.preferredBrand}
                onChange={e => setForm({...form, preferredBrand: e.target.value})}
                spellCheck={false}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">선호 모델명 (선택)</label>
              <input 
                type="text" 
                placeholder="예) TS III SA"
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                value={form.preferredModel}
                onChange={e => setForm({...form, preferredModel: e.target.value})}
                spellCheck={false}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명 <span className="text-red-500">*</span></label>
            <textarea 
              rows={4}
              placeholder="필요한 상품에 대해 자세히 설명해주세요. 대체 가능한 다른 상품이 있다면 함께 적어주시면 좋습니다."
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              required
              spellCheck={false}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">첨부창 (사진 등록) <span className="text-slate-400 text-xs font-normal ml-1">선택사항</span></label>
            <div className="mt-1 flex items-center gap-4">
              <label className="relative cursor-pointer bg-white border border-slate-300 rounded-md px-4 py-2 flex items-center gap-2 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-teal-500">
                <ImagePlus size={18} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">이미지 첨부</span>
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
              {imagePreview && (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-md border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-md border border-slate-200 hover:bg-slate-100"
                  >
                    <X size={14} className="text-slate-600" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href="/marketplace" className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              취소
            </Link>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? '등록 중...' : '신청하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
