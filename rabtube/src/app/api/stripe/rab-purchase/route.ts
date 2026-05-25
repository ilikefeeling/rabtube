export const dynamic = 'force-dynamic';

/**
 * POST /api/stripe/rab-purchase
 * RAB 토큰 직접 구매 세션 생성 (연속형 과금율 계산)
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { calculateBilling } from '@/lib/billingService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: NextRequest) {
  try {
    const { userId, rabAmount, email } = await req.json();

    if (!rabAmount || rabAmount <= 0) {
      return NextResponse.json({ error: '잘못된 구매 수량' }, { status: 400 });
    }

    const billing = calculateBilling(rabAmount);
    
    // Stripe 최소 결제 금액(약 $0.50) 방어: 최소 50센트 이상
    const unitAmountCents = Math.round(billing.price * 100);
    if (unitAmountCents < 50) {
      return NextResponse.json({ error: '최소 결제 금액은 $0.50 이상이어야 합니다.' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `RabTube RAB 토큰 ${billing.rab.toLocaleString()}개`,
              description: `할인율 ${billing.rate}% 적용 ($${billing.price})`,
              images: [`${process.env.NEXT_PUBLIC_APP_URL}/rab-token.png`],
            },
            unit_amount: unitAmountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        type:      'rab_purchase',
        usdAmount: String(billing.price),
        rabAmount: String(billing.rab),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/points?purchase=success&rab=${billing.rab}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/points?purchase=canceled`,
      locale: 'ko',
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[RAB Purchase]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
