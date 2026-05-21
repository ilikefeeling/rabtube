export const dynamic = 'force-dynamic';

/**
 * POST /api/stripe/rab-purchase
 * RAB 토큰 직접 구매 세션 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { RAB_EXCHANGE } from '@/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// RAB 구매 패키지
const RAB_PACKAGES: Record<number, { rab: number; label: string }> = {
  1000:  { rab: 90,   label: '₩1,000 → 90 RAB (기본+10%)' },
  5000:  { rab: 500,  label: '₩5,000 → 500 RAB (기본+20%)' },
  10000: { rab: 1100, label: '₩10,000 → 1,100 RAB (기본+25%)' },
  50000: { rab: 6000, label: '₩50,000 → 6,000 RAB (기본+30%)' },
};

export async function POST(req: NextRequest) {
  try {
    const { userId, krwAmount, email } = await req.json();

    const pkg = RAB_PACKAGES[krwAmount];
    if (!pkg) {
      return NextResponse.json({ error: '잘못된 구매 금액' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'krw',
            product_data: {
              name: `RabTube RAB 토큰 ${pkg.rab.toLocaleString()}개`,
              description: pkg.label,
              images: [`${process.env.NEXT_PUBLIC_APP_URL}/rab-token.png`],
            },
            unit_amount: krwAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        type:      'rab_purchase',
        krwAmount: String(krwAmount),
        rabAmount: String(pkg.rab),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/points?purchase=success&rab=${pkg.rab}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/points?purchase=canceled`,
      locale: 'ko',
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[RAB Purchase]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
