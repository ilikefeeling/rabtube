import { NextResponse } from 'next/server';
import { purchaseProduct } from '@/lib/marketplaceService';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const app = getAdminApp();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth(app).verifyIdToken(token);
    const userId = decodedToken.uid;
    
    const body = await request.json();
    const { productId, quantity, shippingAddress, memo } = body;
    
    if (!productId || !quantity || !shippingAddress) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    const orderId = await purchaseProduct(userId, productId, quantity, shippingAddress, memo);
    return NextResponse.json({ success: true, orderId });
  } catch (error: any) {
    console.error('purchaseProduct error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
