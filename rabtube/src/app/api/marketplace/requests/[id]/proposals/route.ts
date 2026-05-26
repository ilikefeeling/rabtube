export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createProposal } from '@/lib/marketplaceService';

/* POST /api/marketplace/requests/[id]/proposals — 제안 등록 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const body = await request.json();
    const { userId, productName, brand, modelNumber, description, priceRab, deliveryDays } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId는 필수입니다.' }, { status: 400 });
    }
    if (!productName?.trim()) {
      return NextResponse.json({ success: false, error: '상품명은 필수입니다.' }, { status: 400 });
    }

    const proposalId = await createProposal(userId, requestId, {
      productName: productName.trim(),
      manufacturer: brand?.trim() ?? '',
      unitPrice: priceRab ?? 0,
      currency: 'RAB',
      minOrderQty: 1,
      leadTimeDays: deliveryDays ?? 7,
      description: description?.trim() ?? '',
      certifications: [],
    });

    return NextResponse.json({ success: true, data: { proposalId } }, { status: 201 });
  } catch (err: any) {
    console.error('[Marketplace Proposal POST]', err);
    const status = err.message?.includes('본인') || err.message?.includes('접수') ? 422 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
