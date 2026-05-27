'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { usePoints } from '@/hooks/usePoints';
import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { balance } = usePoints();
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetch(`/api/marketplace/products/${params.id}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setIsLoading(false);
      })
      .catch(() => {
        setError(true);
        setIsLoading(false);
      });
  }, [params.id]);

  useEffect(() => {
    if (profile && profile.hospital && profile.region) {
      setShippingAddress(`${profile.region} ${profile.hospital}`);
    }
  }, [profile]);

  if (isLoading) return <div className="p-8 text-center">불러오는 중...</div>;
  if (error || !data?.success) return <div className="p-8 text-center text-red-500">상품을 불러올 수 없습니다.</div>;
  
  const product = data;
  const totalRab = (product.priceRab || 0) * quantity;
  const hasEnoughRab = (balance?.balance || 0) >= totalRab;

  const handlePurchase = async () => {
    if (!user) return alert('로그인이 필요합니다.');
    if (!shippingAddress) return alert('배송지 주소를 입력해주세요.');
    if (product.stock < quantity) return alert('재고가 부족합니다.');
    if (!hasEnoughRab) return alert('RAB 잔액이 부족합니다.');
    
    if (!confirm(`총 ${totalRab.toLocaleString()} RAB를 결제하시겠습니까?`)) return;

    setPurchasing(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/marketplace/products/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          shippingAddress,
          memo
        })
      });
      const result = await res.json();
      if (result.success) {
        alert('결제가 완료되었습니다. 주문 내역에서 확인하세요.');
        router.push('/my?tab=orders'); // MyPage의 주문 내역으로 이동 (추후 구현 가능)
      } else {
        alert(result.error || '결제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('결제 중 오류가 발생했습니다.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/marketplace" className="text-sm text-gray-500 hover:text-gray-900">&larr; 마켓플레이스로 돌아가기</Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* 상품 이미지 영역 */}
          <div className="bg-gray-100 min-h-[400px] flex items-center justify-center">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400">이미지 준비 중</span>
            )}
          </div>
          
          {/* 상품 정보 및 결제 폼 */}
          <div className="p-8 flex flex-col">
            <div className="mb-2">
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-medium mr-2">{product.category}</span>
              <span className="text-sm text-primary-600 font-bold">{product.brand}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
            
            <div className="flex items-baseline gap-4 mb-6 pb-6 border-b border-gray-100">
              <span className="text-3xl font-bold text-primary-600">{product.priceRab?.toLocaleString()} RAB</span>
              <span className="text-gray-500 line-through">₩{product.priceCash?.toLocaleString()}</span>
            </div>
            
            <div className="text-sm text-gray-600 mb-8 whitespace-pre-wrap flex-grow">
              {product.description || '상세 설명이 없습니다.'}
            </div>

            {/* 결제/주문 폼 */}
            <div className="bg-gray-50 p-5 rounded-lg space-y-4 border border-gray-100">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">구매 수량</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-white border flex items-center justify-center hover:bg-gray-50"
                  >-</button>
                  <span className="w-8 text-center font-bold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-8 h-8 rounded-full bg-white border flex items-center justify-center hover:bg-gray-50"
                  >+</button>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">남은 재고: {product.stock}{product.unit}</div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배송지 주소</label>
                <input 
                  type="text" 
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  placeholder="병원 주소를 입력해주세요"
                  className="w-full text-sm border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배송 메모</label>
                <input 
                  type="text" 
                  value={memo}
                  onChange={e => setMemo(e.target.value)}
                  placeholder="배송 전 연락주세요"
                  className="w-full text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div className="pt-4 border-t border-gray-200 mt-4">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-gray-600">총 결제 RAB</span>
                  <span className="text-2xl font-bold text-primary-600">{totalRab.toLocaleString()} RAB</span>
                </div>
                
                {user ? (
                  <button 
                    onClick={handlePurchase}
                    disabled={purchasing || !hasEnoughRab || product.stock < quantity}
                    className="w-full py-3 bg-primary-600 text-white rounded-lg font-bold text-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {purchasing ? '결제 처리 중...' : 
                     !hasEnoughRab ? 'RAB 잔액 부족' : 
                     product.stock < quantity ? '재고 부족' : 'RAB로 구매하기'}
                  </button>
                ) : (
                  <button disabled className="w-full py-3 bg-gray-300 text-gray-600 rounded-lg font-bold text-lg cursor-not-allowed">
                    로그인 후 구매 가능합니다
                  </button>
                )}
                {user && (
                  <div className="text-center mt-2 text-xs text-gray-500">
                    보유 RAB: <span className="font-bold">{balance?.balance?.toLocaleString() || 0} RAB</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
