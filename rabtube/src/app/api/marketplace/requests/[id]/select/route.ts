export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { acceptProposal } from '@/lib/marketplaceService';

/* POST /api/marketplace/requests/[id]/select — 제안 채택 (에스크로 정산) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const body = await request.json();
    const { proposalId, userId } = body;

    if (!userId || !proposalId) {
      return NextResponse.json(
        { success: false, error: 'userId와 proposalId가 필수입니다.' },
        { status: 400 },
      );
    }

    await acceptProposal(userId, requestId, proposalId);

    return NextResponse.json({ success: true, message: '제안이 채택되었습니다.' });
  } catch (err: any) {
    console.error('[Marketplace Select POST]', err);
    const status = err.message?.includes('등록자') || err.message?.includes('불가') ? 422 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
