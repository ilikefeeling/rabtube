export const dynamic = 'force-dynamic';

/**
 * POST /api/marketplace/cancel — 의뢰 취소 + 에스크로 90% 환급
 */

import { NextRequest, NextResponse } from 'next/server';
import { cancelRequest } from '@/lib/marketplaceService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { requesterId, requestId } = body;

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

    await cancelRequest(requesterId, requestId);

    return NextResponse.json({ success: true, data: { message: '의뢰가 취소되었습니다.' } });
  } catch (err: any) {
    console.error('[Marketplace Cancel POST]', err);

    // 권한/상태 관련 비즈니스 에러
    if (
      err.message?.includes('등록자만') ||
      err.message?.includes('존재하지 않는') ||
      err.message?.includes('취소 불가')
    ) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { success: false, error: err.message ?? '의뢰 취소 처리 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
