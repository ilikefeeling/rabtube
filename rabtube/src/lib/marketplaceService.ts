import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, limit as limitFn, serverTimestamp, Timestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from './firebase';
import type { DentalCategory, RequestStatus, OrderStatus } from '@/types';

const COL = {
  PRODUCTS: 'shop_products',
  ORDERS: 'shop_orders',
  REQUESTS: 'product_requests',
  BALANCES: 'rab_balances',
  TRANSACTIONS: 'rab_transactions',
} as const;

/* =========================================================================
   1. 상품등록 요청 (Product Requests) - 에스크로/RAB 없음
   ========================================================================= */

export interface CreateRequestData {
  title: string;
  description: string;
  category: DentalCategory;
  preferredBrand?: string;
  preferredModel?: string;
  quantity?: number;
  unit?: string;
  imageUrl?: string;
}

export async function createProductRequest(requesterId: string, data: CreateRequestData): Promise<string> {
  const docRef = await addDoc(collection(db, COL.REQUESTS), {
    requesterId,
    title: data.title,
    description: data.description,
    category: data.category,
    preferredBrand: data.preferredBrand ?? '',
    preferredModel: data.preferredModel ?? '',
    quantity: data.quantity ?? 1,
    unit: data.unit ?? '개',
    imageUrl: data.imageUrl ?? '',
    status: 'OPEN',
    upvoteCount: 0,
    upvoterIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getProductRequests(opts?: { status?: RequestStatus; category?: DentalCategory; limitCount?: number }) {
  const { status, category, limitCount = 50 } = opts ?? {};
  
  const constraints: any[] = [];
  if (status) constraints.push(where('status', '==', status));
  if (category) constraints.push(where('category', '==', category));
  
  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limitFn(limitCount));
  
  const q = query(collection(db, COL.REQUESTS), ...constraints);
  const snap = await getDocs(q);
  
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() ?? new Date().toISOString(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() ?? new Date().toISOString(),
    };
  });
}

export async function upvoteRequest(userId: string, requestId: string): Promise<void> {
  const reqRef = doc(db, COL.REQUESTS, requestId);
  
  await runTransaction(db, async (t) => {
    const snap = await t.get(reqRef);
    if (!snap.exists()) throw new Error('요청을 찾을 수 없습니다.');
    
    const data = snap.data();
    const upvoterIds: string[] = data.upvoterIds || [];
    
    if (upvoterIds.includes(userId)) {
      throw new Error('이미 공감한 요청입니다.');
    }
    
    t.update(reqRef, {
      upvoterIds: [...upvoterIds, userId],
      upvoteCount: (data.upvoteCount || 0) + 1,
      updatedAt: serverTimestamp(),
    });
  });
}

/* =========================================================================
   2. 쇼핑몰 (Shop) - 상품 관리 및 RAB 결제
   ========================================================================= */

export async function getProducts(opts?: { category?: DentalCategory; isActive?: boolean; limitCount?: number }) {
  const { category, isActive = true, limitCount = 50 } = opts ?? {};
  
  const constraints: any[] = [];
  constraints.push(where('isActive', '==', isActive));
  if (category) constraints.push(where('category', '==', category));
  
  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limitFn(limitCount));
  
  const q = query(collection(db, COL.PRODUCTS), ...constraints);
  const snap = await getDocs(q);
  
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() ?? new Date().toISOString(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() ?? new Date().toISOString(),
    };
  });
}

export async function getProductById(productId: string) {
  const snap = await getDoc(doc(db, COL.PRODUCTS, productId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() ?? new Date().toISOString(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() ?? new Date().toISOString(),
  };
}

export async function purchaseProduct(buyerId: string, productId: string, quantity: number, shippingAddress: string, memo: string = '') {
  const productRef = doc(db, COL.PRODUCTS, productId);
  const balanceRef = doc(db, COL.BALANCES, buyerId);
  const newOrderRef = doc(collection(db, COL.ORDERS));
  const newTxRef = doc(collection(db, COL.TRANSACTIONS));
  
  await runTransaction(db, async (t) => {
    // 1. 상품 확인
    const pSnap = await t.get(productRef);
    if (!pSnap.exists()) throw new Error('상품을 찾을 수 없습니다.');
    const product = pSnap.data();
    if (!product.isActive) throw new Error('현재 판매 중인 상품이 아닙니다.');
    if (product.stock < quantity) throw new Error(`재고가 부족합니다. (남은 수량: ${product.stock})`);
    
    // 2. 유저 잔액 확인
    const bSnap = await t.get(balanceRef);
    if (!bSnap.exists()) throw new Error('포인트 정보를 찾을 수 없습니다.');
    const bData = bSnap.data();
    
    const totalRab = (product.priceRab || 0) * quantity;
    if (bData.balance < totalRab) {
      throw new Error(`RAB 잔액이 부족합니다. (필요: ${totalRab} RAB)`);
    }
    
    // 3. 업데이트 적용 (재고 감소, 잔액 차감)
    t.update(productRef, {
      stock: product.stock - quantity,
      updatedAt: serverTimestamp(),
    });
    
    t.update(balanceRef, {
      balance: bData.balance - totalRab,
      totalSpent: (bData.totalSpent || 0) + totalRab,
      updatedAt: serverTimestamp(),
    });
    
    // 4. 트랜잭션 기록
    t.set(newTxRef, {
      userId: buyerId,
      type: 'SHOP_PURCHASE',
      amount: -totalRab,
      balanceAfter: bData.balance - totalRab,
      status: 'confirmed',
      description: `쇼핑몰 구매: ${product.name} ${quantity}개`,
      relatedCaseId: newOrderRef.id, // 편의상 orderId 저장
      createdAt: serverTimestamp(),
    });
    
    // 5. 주문 생성
    t.set(newOrderRef, {
      buyerId,
      productId,
      productName: product.name,
      supplierId: product.supplierId || '',
      quantity,
      totalRab,
      status: 'PENDING',
      shippingAddress,
      memo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  
  return newOrderRef.id;
}
