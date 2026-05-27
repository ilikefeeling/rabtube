import { NextResponse } from 'next/server';
import { upvoteRequest } from '@/lib/marketplaceService';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebaseAdmin';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const app = getAdminApp();
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth(app).verifyIdToken(token);
    const userId = decodedToken.uid;
    
    await upvoteRequest(userId, params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
