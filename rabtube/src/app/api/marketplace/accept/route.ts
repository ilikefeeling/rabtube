export const dynamic = 'force-dynamic';

/**
 * POST /api/marketplace/accept — 제안 채택 + 에스크로 정산
 */

import { NextRequest, NextResponse } from 'next/server';
import { acceptProposal } from '@/lib/marketplaceService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { requesterId, requestId, proposalId } = body;

    // 필수 필드 검증
    if (!requesterId || typeof requesterId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'requesterId는 필수입니다.' },
        { status: 400 },
      );
    }
    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'requestId는 필수입니다.' },
        { status: 400 },
      );
    }
    if (!proposalId || typeof proposalId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'proposalId는 필수입니다.' },
        { status: 400 },
      );
    }

    await acceptProposal(requesterId, requestId, proposalId);

    return NextResponse.json({ success: true, data: { message: '제안이 채택되었습니다.' } });
  } catch (err: any) {
    console.error('[Marketplace Accept POST]', err);

    // 권한/상태 관련 비즈니스 에러
    if (
      err.message?.includes('등록자만') ||
      err.message?.includes('존재하지 않는') ||
      err.message?.includes('채택 불가') ||
      err.message?.includes('속하지 않는')
    ) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { success: false, error: err.message ?? '제안 채택 처리 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
