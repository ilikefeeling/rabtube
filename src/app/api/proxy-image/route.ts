import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return new NextResponse('Missing url', { status: 400 });
  }
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return new NextResponse(`Failed to fetch image: ${res.statusText}`, { status: res.status });
    }
    
    const blob = await res.blob();
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000, immutable',
      }
    });
  } catch (error: any) {
    return new NextResponse(`Error fetching image: ${error.message}`, { status: 500 });
  }
}
