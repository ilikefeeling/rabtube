export const dynamic = 'force-dynamic';

/**
 * POST /api/stripe/cancel
 * 구독 기간 만료 후 해지 예약
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: NextRequest) {
  try {
    const { stripeSubId } = await req.json();
    if (!stripeSubId) {
      return NextResponse.json({ error: '구독 ID 누락' }, { status: 400 });
    }

    // 즉시 해지 아님 — 현재 기간 만료 후 해지 예약
    await stripe.subscriptions.update(stripeSubId, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Stripe Cancel]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
