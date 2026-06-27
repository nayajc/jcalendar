import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '법률 상담 예약',
};

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: '#FAFBFD',
          fontFamily: '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif',
          WebkitFontSmoothing: 'antialiased',
          color: '#0F1923',
        }}
      >
        {children}
      </body>
    </html>
  );
}
