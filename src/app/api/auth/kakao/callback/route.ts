import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Kakao login error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=kakao_login_failed', request.url));
  }

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

  const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID?.trim();
  const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI?.trim();
  const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET?.trim();

  console.log('--- KAKAO TOKEN REQUEST DEBUG ---');
  console.log('CLIENT_ID:', KAKAO_CLIENT_ID);
  console.log('REDIRECT_URI:', KAKAO_REDIRECT_URI);
  console.log('CODE:', code);
  console.log('---------------------------------');

  try {
    // 1. Exchange code for Kakao access token
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KAKAO_CLIENT_ID!,
        client_secret: KAKAO_CLIENT_SECRET!,
        redirect_uri: KAKAO_REDIRECT_URI!,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Kakao token error:', tokenData);
      return NextResponse.redirect(new URL('/auth/login?error=kakao_token_error', request.url));
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch user information from Kakao
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    const userData = await userResponse.json();

    if (!userData.id) {
      console.error('Failed to get Kakao user id:', userData);
      return NextResponse.redirect(new URL('/auth/login?error=kakao_profile_error', request.url));
    }

    const kakaoId = userData.id.toString();
    const kakaoAccount = userData.kakao_account || {};
    const email = kakaoAccount.email || `${kakaoId}@kakao.user.rabtube.com`; // Fallback email
    const name = kakaoAccount.profile?.nickname || '카카오 유저';

    const uid = `kakao:${kakaoId}`;

    // 3. Create or Update Firebase User
    try {
      await adminAuth.getUser(uid);
      // User exists in Auth, but we must ensure Firestore doc exists
      const userRef = adminDb.collection('users').doc(uid);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        await userRef.set({
          uid,
          email,
          name,
          phone: '',
          birthDate: '',
          hospitalName: '',
          region: '',
          licenseNumber: '',
          licenseUrl: '',
          role: 'user',
          status: 'associate',
          createdAt: new Date(),
          updatedAt: new Date(),
          provider: 'kakao',
        });
      }
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        // Create new user in Auth
        await adminAuth.createUser({
          uid: uid,
          email: email,
          displayName: name,
          emailVerified: true,
        });

        // Add to users (Firestore)
        const userRef = adminDb.collection('users').doc(uid);
        await userRef.set({
          uid,
          email,
          name,
          phone: '',
          birthDate: '',
          hospitalName: '',
          region: '',
          licenseNumber: '',
          licenseUrl: '',
          role: 'user',
          status: 'associate',
          createdAt: new Date(),
          updatedAt: new Date(),
          provider: 'kakao',
        });
      } else {
        throw e;
      }
    }

    // 4. Mint a Firebase Custom Token
    const customToken = await adminAuth.createCustomToken(uid);

    // 5. Redirect to client-side success page to complete login
    const redirectUrl = new URL('/auth/kakao/success', request.url);
    redirectUrl.searchParams.set('token', customToken);

    return NextResponse.redirect(redirectUrl);

  } catch (err: any) {
    console.error('Kakao callback processing error:', err);
    return NextResponse.redirect(new URL('/auth/login?error=server_error', request.url));
  }
}
