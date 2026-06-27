import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

/**
 * 세션 쿠키를 검증하고 변호사 UID를 반환합니다.
 * 인증 실패 시 null 반환.
 */
export async function getAuthenticatedLawyerId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decoded.uid;
  } catch {
    return null;
  }
}
