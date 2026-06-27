import { google } from 'googleapis';
import { adminDb } from '@/lib/firebase/admin';
import { encrypt, decrypt } from '@/lib/crypto';
import type { Lawyer } from '@/types';
import { Timestamp } from 'firebase-admin/firestore';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

/**
 * Google OAuth2 클라이언트를 생성합니다. (인증 없는 기본 클라이언트)
 */
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Google OAuth 인증 URL을 생성합니다.
 * @param state CSRF 방지용 상태값 (Firebase UID)
 */
export function generateAuthUrl(state: string): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent', // refresh_token을 항상 발급받기 위해
  });
}

/**
 * 변호사의 토큰을 사용한 인증된 Google API 클라이언트를 반환합니다.
 * 토큰 만료 시 자동으로 갱신합니다.
 */
export async function getAuthenticatedClient(lawyer: Lawyer) {
  if (!lawyer.googleCalendar) {
    throw new Error('Google Calendar가 연결되지 않았습니다');
  }

  const client = createOAuth2Client();

  const accessToken = decrypt(lawyer.googleCalendar.accessToken);
  const refreshToken = decrypt(lawyer.googleCalendar.refreshToken);
  const expiryDate = lawyer.googleCalendar.tokenExpiry.toDate().getTime();

  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiryDate,
  });

  // 토큰 갱신 이벤트 처리
  client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      const updates: Record<string, unknown> = {
        'googleCalendar.accessToken': encrypt(tokens.access_token),
        updatedAt: Timestamp.now(),
      };
      if (tokens.expiry_date) {
        updates['googleCalendar.tokenExpiry'] = Timestamp.fromMillis(tokens.expiry_date);
      }
      await adminDb.collection('lawyers').doc(lawyer.id).update(updates);
    }
  });

  // 만료 시 사전 갱신
  if (expiryDate && Date.now() >= expiryDate - 5 * 60 * 1000) {
    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);
  }

  return client;
}
