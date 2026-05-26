export const dynamic = 'force-dynamic';

/**
 * GET  /api/marketplace/requests  — 의뢰 목록 조회
 * POST /api/marketplace/requests  — 의뢰 등록 (에스크로 동결 포함)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createRequest,
  getRequests,
  type DentalCategory,
  type RequestStatus,
} from '@/lib/marketplaceService';

/* ─────────────── GET ─────────────── */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const status   = (searchParams.get('status') ?? 'OPEN') as RequestStatus;
    const category = searchParams.get('category') as DentalCategory | null;
    const limitStr = searchParams.get('limit');
    const limitCount = limitStr ? Math.min(Math.max(parseInt(limitStr, 10), 1), 100) : 50;

    const requests = await getRequests({
      status,
      category: category ?? undefined,
      limitCount,
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (err: any) {
    console.error('[Marketplace Requests GET]', err);
    return NextResponse.json(
      { success: false, error: err.message ?? '의뢰 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

/* ─────────────── POST ─────────────── */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { requesterId, title, description, category, bountyRab, specifications, quantity, unit, expiresInDays } = body;

    // 필수 필드 검증
    if (!requesterId || typeof requesterId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'requesterId는 필수입니다.' },
        { status: 400 },
      );
    }
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'title은 필수입니다.' },
        { status: 400 },
      );
    }
    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { success: false, error: 'description은 필수입니다.' },
        { status: 400 },
      );
    }
    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { success: false, error: 'category는 필수입니다.' },
        { status: 400 },
      );
    }
    if (typeof bountyRab !== 'number' || bountyRab < 0) {
      return NextResponse.json(
        { success: false, error: 'bountyRab은 0 이상의 숫자여야 합니다.' },
        { status: 400 },
      );
    }

    // deadline 계산 (expiresInDays → Date)
    const deadlineDays = typeof expiresInDays === 'number' && expiresInDays > 0
      ? expiresInDays
      : 7;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + deadlineDays);

    const requestId = await createRequest(requesterId, {
      title:          title.trim(),
      description:    description.trim(),
      category:       category as DentalCategory,
      specifications: specifications ?? '',
      quantity:       typeof quantity === 'number' ? quantity : 1,
      unit:           typeof unit === 'string' ? unit : '개',
      bountyRab,
      deadline,
    });

    return NextResponse.json(
      { success: true, data: { requestId } },
      { status: 201 },
    );
  } catch (err: any) {
    console.error('[Marketplace Requests POST]', err);

    // 잔액 부족 등 비즈니스 로직 에러
    if (err.message?.includes('잔액') || err.message?.includes('바운티')) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { success: false, error: err.message ?? '의뢰 등록 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
