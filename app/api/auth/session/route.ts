import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

const SESSION_DURATION_MS = 60 * 60 * 24 * 14 * 1000; // 14일

export async function POST(req: Request) {
  try {
    const body = await req.json() as { idToken?: string };
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ error: 'idToken이 필요합니다' }, { status: 400 });
    }

    // idToken 검증
    await adminAuth.verifyIdToken(idToken);

    // 세션 쿠키 생성
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: SESSION_DURATION_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // OAuth 콜백(Google→/api/auth/google-calendar)은 cross-site 최상위 GET 이동이라
      // 'strict'면 쿠키가 전송되지 않아 세션이 끊깁니다. 'lax'로 두면 GET 이동엔 전송되고
      // POST CSRF는 계속 차단됩니다.
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[Session] 세션 생성 실패:', error);
    return NextResponse.json({ error: '인증에 실패했습니다' }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[Session] 로그아웃 실패:', error);
    return NextResponse.json({ error: '로그아웃에 실패했습니다' }, { status: 500 });
  }
}
