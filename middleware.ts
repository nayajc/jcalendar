import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/settings'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 보호 경로 확인
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Edge Runtime에서는 Firebase Admin을 직접 사용할 수 없으므로
  // 세션 쿠키 존재 여부로만 1차 확인하고, 실제 검증은 서버 컴포넌트/API Route에서 처리
  // 더 강력한 검증이 필요하면 별도 검증 API를 호출하거나 jose 등 Edge 호환 JWT 라이브러리 사용
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
};
