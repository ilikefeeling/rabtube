import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/marketplaceService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as any;
    
    const products = await getProducts({ category });
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('getProducts error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
