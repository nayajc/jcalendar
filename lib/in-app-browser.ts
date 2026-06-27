// Google OAuth rejects embedded WebViews with `disallowed_useragent`.
// KakaoTalk/Naver/Instagram/Line in-app browsers (and bare Android WebViews)
// trigger this, so we detect them and route the user out to a real browser
// before sending them to the Google consent screen.
export function isInAppBrowser(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return /kakaotalk|naver|line\/|fban|fbav|fb_iab|instagram|everytimeapp|; wv\)/.test(ua);
}

export function isAndroid(userAgent: string): boolean {
  return /android/i.test(userAgent);
}

// Re-opens `url` in Chrome on Android via an intent URL. Has no iOS
// equivalent (no public API lets a WebView force-launch Safari there),
// so iOS users are told to open the link manually instead.
export function toAndroidChromeIntentUrl(url: string): string {
  const stripped = url.replace(/^https?:\/\//, '');
  return `intent://${stripped}#Intent;scheme=https;package=com.android.chrome;end`;
}
