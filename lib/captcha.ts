/**
 * hCaptcha 서버 검증 스켈레톤
 * https://docs.hcaptcha.com/#verify-the-user-response-server-side
 */

interface HCaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * hCaptcha 토큰을 서버 사이드에서 검증합니다.
 * @param token 클라이언트에서 발급된 hCaptcha 토큰
 * @param remoteip 클라이언트 IP (선택)
 */
export async function verifyCaptcha(
  token: string,
  remoteip?: string
): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET;
  if (!secret) {
    // 개발 환경에서 시크릿 미설정 시 경고 후 통과
    console.warn('[Captcha] HCAPTCHA_SECRET이 설정되지 않았습니다. 개발 환경에서만 허용됩니다.');
    return process.env.NODE_ENV === 'development';
  }

  const params = new URLSearchParams({
    secret,
    response: token,
  });
  if (remoteip) {
    params.append('remoteip', remoteip);
  }

  const response = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`hCaptcha 검증 요청 실패: ${response.status}`);
  }

  const data = (await response.json()) as HCaptchaVerifyResponse;

  if (!data.success) {
    const errors = data['error-codes']?.join(', ') ?? '알 수 없는 오류';
    console.warn(`[Captcha] 검증 실패: ${errors}`);
  }

  return data.success;
}
