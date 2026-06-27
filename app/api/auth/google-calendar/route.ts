import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { createOAuth2Client } from '@/lib/google-calendar/client';
import { encrypt } from '@/lib/crypto';
import { cookies } from 'next/headers';
import { Timestamp } from 'firebase-admin/firestore';
import { google } from 'googleapis';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // Firebase UID
  const errorParam = url.searchParams.get('error');

  if (errorParam) {
    return NextResponse.redirect(
      new URL('/settings/google-calendar?error=access_denied', req.url)
    );
  }

  if (!code || !state) {
    return NextResponse.json({ error: 'code 또는 state 파라미터가 없습니다' }, { status: 400 });
  }

  // state = Firebase UID 검증 (세션 쿠키와 비교)
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  let lawyerId: string;
  try {
    const claims = await adminAuth.verifySessionCookie(sessionCookie, true);
    lawyerId = claims.uid;
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // state == lawyerId CSRF 검증
  if (state !== lawyerId) {
    return NextResponse.json({ error: 'CSRF 검증 실패' }, { status: 403 });
  }

  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('토큰 발급에 실패했습니다. refresh_token이 없습니다.');
    }

    oauth2Client.setCredentials(tokens);

    // 기본 캘린더 ID 조회
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarList = await calendar.calendarList.get({ calendarId: 'primary' });
    const calendarId = calendarList.data.id ?? 'primary';

    // 토큰 암호화 후 Firestore 저장
    const googleCalendarData = {
      calendarId,
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      tokenExpiry: tokens.expiry_date
        ? Timestamp.fromMillis(tokens.expiry_date)
        : Timestamp.fromMillis(Date.now() + 3600 * 1000),
    };

    await adminDb
      .collection('lawyers')
      .doc(lawyerId)
      .set(
        {
          googleCalendar: googleCalendarData,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );

    return NextResponse.redirect(
      new URL('/settings/google-calendar?connected=true', req.url)
    );
  } catch (error) {
    console.error('[GoogleCalendar OAuth] 오류:', error);
    return NextResponse.redirect(
      new URL('/settings/google-calendar?error=token_exchange_failed', req.url)
    );
  }
}
