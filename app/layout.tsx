import type { Metadata, Viewport } from 'next';
import { DM_Serif_Display, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import SwRegister from './sw-register';
import { LocaleProvider } from '@/lib/i18n/LocaleProvider';

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dm-serif',
  display: 'swap',
});

const notoSans = Noto_Sans_KR({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-noto',
  display: 'swap',
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://your-domain.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Jolly Calendar — 상담 예약 자동화 캘린더',
    template: '%s · Jolly Calendar',
  },
  description: 'Google Calendar와 연동되는 상담 예약 캘린더 SaaS. 이중예약 방지와 자동 리마인더로 상담사의 일정 관리를 자동화합니다.',
  applicationName: 'Jolly Calendar',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Jolly Calendar',
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    siteName: 'Jolly Calendar',
    locale: 'ko_KR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#1A3050',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${dmSerif.variable} ${notoSans.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LocaleProvider>
          <SwRegister />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
