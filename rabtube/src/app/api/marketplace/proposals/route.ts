export const dynamic = 'force-dynamic';

/**
 * GET  /api/marketplace/proposals  — 특정 의뢰의 제안 목록 조회
 * POST /api/marketplace/proposals  — 제안 제출
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createProposal,
  getRequestById,
} from '@/lib/marketplaceService';

/* ─────────────── GET ─────────────── */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const requestId = searchParams.get('requestId');

    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'requestId query parameter는 필수입니다.' },
        { status: 400 },
      );
    }

    const result = await getRequestById(requestId);

    if (!result) {
      return NextResponse.json(
        { success: false, error: '해당 의뢰를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        request:   result.request,
        proposals: result.proposals,
      },
    });
  } catch (err: any) {
    console.error('[Marketplace Proposals GET]', err);
    return NextResponse.json(
      { success: false, error: err.message ?? '제안 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

/* ─────────────── POST ─────────────── */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      proposerId, requestId,
      productName, manufacturer, unitPrice, currency,
      minOrderQty, leadTimeDays, description, certifications,
    } = body;

    // 필수 필드 검증
    if (!proposerId || typeof proposerId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'proposerId는 필수입니다.' },
        { status: 400 },
      );
    }
    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'requestId는 필수입니다.' },
        { status: 400 },
      );
    }
    if (!productName || typeof productName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'productName은 필수입니다.' },
        { status: 400 },
      );
    }
    if (!manufacturer || typeof manufacturer !== 'string') {
      return NextResponse.json(
        { success: false, error: 'manufacturer는 필수입니다.' },
        { status: 400 },
      );
    }
    if (typeof unitPrice !== 'number' || unitPrice < 0) {
      return NextResponse.json(
        { success: false, error: 'unitPrice는 0 이상의 숫자여야 합니다.' },
        { status: 400 },
      );
    }
    if (typeof leadTimeDays !== 'number' || leadTimeDays < 1) {
      return NextResponse.json(
        { success: false, error: 'leadTimeDays는 1 이상이어야 합니다.' },
        { status: 400 },
      );
    }

    const proposalId = await createProposal(proposerId, requestId, {
      productName:    productName.trim(),
      manufacturer:   manufacturer.trim(),
      unitPrice,
      currency:       typeof currency === 'string' ? currency : 'KRW',
      minOrderQty:    typeof minOrderQty === 'number' ? minOrderQty : 1,
      leadTimeDays,
      description:    typeof description === 'string' ? description.trim() : '',
      certifications: Array.isArray(certifications) ? certifications : [],
    });

    return NextResponse.json(
      { success: true, data: { proposalId } },
      { status: 201 },
    );
  } catch (err: any) {
    console.error('[Marketplace Proposals POST]', err);

    // 비즈니스 로직 에러 (의뢰 미존재, 본인 제안 등)
    if (
      err.message?.includes('존재하지 않는') ||
      err.message?.includes('본인의') ||
      err.message?.includes('제안 접수')
    ) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { success: false, error: err.message ?? '제안 제출 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
