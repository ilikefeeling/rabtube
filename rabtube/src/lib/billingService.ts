export function calculateBilling(rabAmount: number) {
  const BASE_PRICE_PER_RAB = 0.01988;
  const validatedRab = Math.max(1, Math.min(100000, rabAmount)); 
  
  let rate = 0; // %

  if (validatedRab >= 1 && validatedRab <= 10) {
    rate = 2 + ((validatedRab - 1) * (5 - 2)) / (10 - 1);
  } else if (validatedRab > 10 && validatedRab <= 50) {
    rate = 5 + ((validatedRab - 10) * (10 - 5)) / (50 - 10);
  } else if (validatedRab > 50 && validatedRab <= 100) {
    rate = 10 + ((validatedRab - 50) * (15 - 10)) / (100 - 50);
  } else if (validatedRab > 100 && validatedRab <= 500) {
    rate = 15 + ((validatedRab - 100) * (20 - 15)) / (500 - 100);
  } else if (validatedRab > 500 && validatedRab <= 600) {
    rate = 20 + ((validatedRab - 500) * (26 - 20)) / (600 - 500);
  } else if (validatedRab > 600 && validatedRab <= 700) {
    rate = 26 + ((validatedRab - 600) * (28 - 26)) / (700 - 600);
  } else if (validatedRab > 700 && validatedRab <= 800) {
    rate = 28 + ((validatedRab - 700) * (30 - 28)) / (800 - 700);
  } else if (validatedRab > 800 && validatedRab <= 900) {
    rate = 30 + ((validatedRab - 800) * (32 - 30)) / (900 - 800);
  } else if (validatedRab > 900 && validatedRab <= 1000) {
    rate = 32 + ((validatedRab - 900) * (34 - 32)) / (1000 - 900);
  } else if (validatedRab > 1000 && validatedRab <= 10000) {
    rate = 34 + ((validatedRab - 1000) * (38 - 34)) / (10000 - 1000);
  }

  const rawPrice = validatedRab * BASE_PRICE_PER_RAB * (rate / 100);
  const finalPrice = Math.round(rawPrice * 100) / 100;

  return {
    rab: validatedRab,
    rate: Math.round(rate * 100) / 100,
    price: finalPrice
  };
}

// 업로드 시 부과되는 일회성 과금(RAB) 계산: 설정 열람 금액 * 과금율
export function calculateUploadFeeRab(priceRab: number): number {
  if (priceRab <= 0) return 0;
  const billing = calculateBilling(priceRab);
  return Math.max(1, Math.round(priceRab * (billing.rate / 100)));
}

// $10 부터 구매 가능해야 하므로 최소값을 계산
export function getMinRabFor10USD(): number {
  for (let i = 1; i <= 10000; i++) {
    if (calculateBilling(i).price >= 10) {
      return i;
    }
  }
  return 1500; // fallback
}

export const MIN_RAB = getMinRabFor10USD();
export const MAX_RAB = 10000;

