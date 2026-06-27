import type { Metadata } from 'next';
import { AuthHero } from '@/components/auth/AuthHero';

export const metadata: Metadata = {
  title: 'Jolly Calendar — 상담 예약을 자동으로 관리하는 캘린더 SaaS',
  description:
    'Google Calendar와 연동되는 상담 예약 캘린더. 이중예약 방지, 자동 리마인더, 어디든 임베드 가능한 예약 위젯으로 상담사의 일정 관리를 자동화합니다.',
  keywords: ['상담 예약', '예약 캘린더', 'Google Calendar 연동', '예약 위젯', '이중예약 방지', 'booking calendar', 'appointment scheduling'],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Jolly Calendar — 상담 예약 자동화 캘린더',
    description: 'Google Calendar와 연동된 예약 캘린더로 이중예약 걱정 없이 의뢰부터 확정까지 자동화하세요.',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Jolly Calendar',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jolly Calendar — 상담 예약 자동화 캘린더',
    description: 'Google Calendar와 연동된 예약 캘린더로 이중예약 걱정 없이 의뢰부터 확정까지 자동화하세요.',
  },
  alternates: {
    canonical: '/login',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Jolly Calendar',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Google Calendar와 연동되는 상담 예약 캘린더. 이중예약 방지, 자동 리마인더, 어디든 임베드 가능한 예약 위젯을 제공합니다.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AuthHero>{children}</AuthHero>
    </>
  );
}
