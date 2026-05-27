'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DENTAL_CATEGORIES, DentalCategory } from '@/types';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { createProductRequest } from '@/lib/marketplaceService';
import { uploadGenericImage } from '@/lib/firebaseService';
import { ImagePlus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function NewProductRequestPage() {
  const t = useTranslations('Marketplace');
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
    if (!user) return alert(t('loginReq'));
    if (!form.title || !form.category || !form.description) {
      return alert(t('fillReq'));
    }
    if (form.quantity > 999) {
      return alert(t('qtyLimit'));
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
      alert(t('successMsg'));
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
        <h1 className="text-2xl font-bold text-gray-900">{t('reqPageTitle')}</h1>
        <Link href="/marketplace" className="text-sm text-gray-500 hover:text-gray-900">{t('goBack')}</Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-gray-600 mb-6 pb-6 border-b">
          {t('reqPageDesc1')}<br/>
          {t('reqPageDesc2')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reqTitle')} <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder={t('reqTitlePlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              required
              spellCheck={false}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('category')} <span className="text-red-500">*</span></label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value as DentalCategory})}
                required
              >
                <option value="">{t('selectPlease')}</option>
                {DENTAL_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('estQuantityLabel')} <span className="text-red-500">*</span></label>
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
                  <option value="개">{t('unitEa')}</option>
                  <option value="박스">{t('unitBox')}</option>
                  <option value="세트">{t('unitSet')}</option>
                  <option value="기타">{t('unitOther')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('prefBrandOpt')}</label>
              <input 
                type="text" 
                placeholder={t('prefBrandPlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                value={form.preferredBrand}
                onChange={e => setForm({...form, preferredBrand: e.target.value})}
                spellCheck={false}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('prefModelOpt')}</label>
              <input 
                type="text" 
                placeholder={t('prefModelPlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                value={form.preferredModel}
                onChange={e => setForm({...form, preferredModel: e.target.value})}
                spellCheck={false}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('detailDesc')} <span className="text-red-500">*</span></label>
            <textarea 
              rows={4}
              placeholder={t('detailDescPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              required
              spellCheck={false}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('attachment')} <span className="text-slate-400 text-xs font-normal ml-1">{t('optional')}</span></label>
            <div className="mt-1 flex items-center gap-4">
              <label className="relative cursor-pointer bg-white border border-slate-300 rounded-md px-4 py-2 flex items-center gap-2 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-teal-500">
                <ImagePlus size={18} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">{t('attachImage')}</span>
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
              {loading ? t('registering') : t('apply')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
