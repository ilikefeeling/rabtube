export const dynamic = 'force-dynamic';

/**
 * POST /api/stripe/checkout
 * Stripe 구독 결제 세션 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { SUBSCRIPTION_PLANS } from '@/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: NextRequest) {
  try {
    const { userId, tier, email } = await req.json();

    if (!userId || !tier || !email) {
      return NextResponse.json({ error: '파라미터 누락' }, { status: 400 });
    }

    const plan = SUBSCRIPTION_PLANS[tier as 'pro' | 'clinic'];
    if (!plan || tier === 'free') {
      return NextResponse.json({ error: '잘못된 요금제' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: (plan as any).stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        tier,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1&tier=${tier}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`,
      locale: 'ko',
      // 한국 결제 수단 추가 (Stripe Korea)
      payment_method_options: {
        card: { request_three_d_secure: 'automatic' },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[Stripe Checkout]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
