import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID?.trim();
  const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI?.trim();

  if (!KAKAO_CLIENT_ID || !KAKAO_REDIRECT_URI) {
    console.error('Kakao environment variables are not set.');
    return NextResponse.json(
      { error: 'Kakao environment variables are missing.' },
      { status: 500 }
    );
  }

  // Generate a random state string for CSRF protection
  const state = Math.random().toString(36).substring(2, 15);

  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}&state=${state}`;

  // We should ideally store the state in an HttpOnly cookie to verify it in the callback
  const response = NextResponse.redirect(kakaoAuthUrl);
  
  response.cookies.set('kakao_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}
