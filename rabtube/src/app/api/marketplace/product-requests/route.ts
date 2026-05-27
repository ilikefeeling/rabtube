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
    const app = getAdminApp();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth(app).verifyIdToken(token);
    const userId = decodedToken.uid;
    
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
