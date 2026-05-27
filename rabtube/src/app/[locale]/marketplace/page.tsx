'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { DENTAL_CATEGORIES, DentalCategory } from '@/types';
import { useAuth } from '@/lib/AuthContext';

export default function MarketplacePage() {
  const t = useTranslations('Marketplace');
  const [activeTab, setActiveTab] = useState<'shop' | 'requests'>('shop');
  const [category, setCategory] = useState<DentalCategory | ''>('');
  
  const [products, setProducts] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, [activeTab, category]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'shop') {
        const res = await fetch(`/api/marketplace/products${category ? `?category=${category}` : ''}`);
        const data = await res.json();
        if (data.success) setProducts(data.products);
      } else {
        const res = await fetch(`/api/marketplace/product-requests${category ? `?category=${category}` : ''}`);
        const data = await res.json();
        if (data.success) setRequests(data.requests);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (reqId: string) => {
    if (!user) return alert('로그인이 필요합니다.');
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/marketplace/product-requests/${reqId}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('공감했습니다.');
        fetchData();
      } else {
        alert(data.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">마켓플레이스</h1>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('shop')}
            className={`${activeTab === 'shop' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
          >
            쇼핑몰
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`${activeTab === 'requests' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
          >
            상품등록 요청
          </button>
        </nav>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setCategory('')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${category === '' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
        >
          전체
        </button>
        {DENTAL_CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${category === c.id ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">불러오는 중...</div>
      ) : activeTab === 'shop' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
              상품을 준비 중입니다. 필요한 상품이 있다면 상품등록 요청을 남겨주세요!
            </div>
          ) : (
            products.map(p => (
              <Link key={p.id} href={`/marketplace/product/${p.id}`} className="block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
                <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="object-cover w-full h-full" />
                  ) : (
                    <div className="flex items-center justify-center h-48 bg-gray-100 text-gray-400">이미지 없음</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-xs text-primary-600 font-medium mb-1">{p.brand}</div>
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{p.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-primary-600">{p.priceRab?.toLocaleString()} RAB</span>
                    <span className="text-sm text-gray-500 line-through">₩{p.priceCash?.toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : (
        <div>
          <div className="flex justify-end mb-4">
            <Link href="/marketplace/product-request/new" className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700">
              상품등록 신청하기
            </Link>
          </div>
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border rounded-lg bg-gray-50">등록된 요청이 없습니다.</div>
            ) : (
              requests.map(req => (
                <div key={req.id} className="border rounded-lg p-5 bg-white flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-medium">{req.category}</span>
                      <span className={`px-2 py-1 text-xs rounded font-medium ${req.status === 'LISTED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {req.status === 'LISTED' ? '입점 완료' : req.status === 'REVIEWING' ? '검토 중' : '수요 조사 중'}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{req.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{req.description}</p>
                    <div className="text-xs text-gray-500">
                      선호 브랜드: {req.preferredBrand || '무관'} | 필요 수량: {req.quantity}{req.unit} | {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <button 
                      onClick={() => handleUpvote(req.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-md border ${req.upvoterIds?.includes(user?.uid) ? 'bg-primary-50 border-primary-200 text-primary-600' : 'hover:bg-gray-50 border-gray-200 text-gray-600'}`}
                      disabled={req.status === 'LISTED'}
                    >
                      <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      <span className="font-bold">{req.upvoteCount || 0}</span>
                    </button>
                    <span className="text-xs text-gray-500 mt-1">나도 필요해요</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
