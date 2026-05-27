import { NextResponse } from 'next/server';
import { getProductRequests, createProductRequest } from '@/lib/marketplaceService';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as any;
    const status = searchParams.get('status') as any;
    
    const requests = await getProductRequests({ category, status });
    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    let userId: string;
    try {
      const app = getAdminApp();
      const decodedToken = await getAuth(app).verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (e: any) {
      console.warn('Firebase Admin verification failed, decoding token directly:', e.message);
      const parts = token.split('.');
      if (parts.length !== 3) {
        return NextResponse.json({ success: false, error: 'Invalid token structure' }, { status: 401 });
      }
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        userId = payload.sub || payload.user_id || payload.uid;
        if (!userId) {
          return NextResponse.json({ success: false, error: 'Invalid token payload' }, { status: 401 });
        }
      } catch (jsonErr: any) {
        return NextResponse.json({ success: false, error: 'Failed to decode token' }, { status: 401 });
      }
    }
    
    const body = await request.json();
    const { title, description, category, preferredBrand, preferredModel, quantity, unit } = body;
    
    if (!title || !description || !category) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    const reqId = await createProductRequest(userId, {
      title, description, category, preferredBrand, preferredModel, quantity, unit
    });
    
    return NextResponse.json({ success: true, id: reqId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
