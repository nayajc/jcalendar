import type { Metadata, Viewport } from 'next';
import { DM_Serif_Display, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import SwRegister from './sw-register';

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

export const metadata: Metadata = {
  title: '전문 상담 예약 관리',
  description: '상담사 예약 캘린더 SaaS',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Jolly Calendar',
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
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
