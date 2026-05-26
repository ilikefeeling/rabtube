export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getRequestById } from '@/lib/marketplaceService';

/* GET /api/marketplace/requests/[id] — 의뢰 상세 + 제안 목록 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getRequestById(id);

    if (!result) {
      return NextResponse.json(
        { success: false, error: '의뢰를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      request: {
        ...result.request,
        authorId: result.request.requesterId,
        authorName: result.request.requesterId.slice(0, 6) + '***',
        specs: {
          brand: '',
          modelNumber: '',
          quantity: result.request.quantity,
          unit: result.request.unit,
        },
        deadline: result.request.deadline
          ? new Date(result.request.deadline).toLocaleDateString('ko-KR')
          : '',
        createdAt: result.request.createdAt
          ? new Date(result.request.createdAt).toLocaleDateString('ko-KR')
          : '',
        status: result.request.status === 'OPEN' ? 'open'
          : result.request.status === 'ACCEPTED' ? 'selected'
          : 'closed',
      },
      proposals: result.proposals.map(p => ({
        id: p.id,
        proposerId: p.proposerId,
        proposerName: p.proposerId.slice(0, 6) + '***',
        productName: p.productName,
        brand: p.manufacturer,
        modelNumber: '',
        description: p.description,
        priceRab: p.unitPrice,
        priceCash: 0,
        deliveryDays: p.leadTimeDays,
        message: '',
        selected: p.status === 'ACCEPTED',
        createdAt: p.createdAt
          ? new Date(p.createdAt).toLocaleDateString('ko-KR')
          : '',
      })),
    });
  } catch (err: any) {
    console.error('[Marketplace Request Detail]', err);
    return NextResponse.json(
      { success: false, error: err.message ?? '의뢰 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
