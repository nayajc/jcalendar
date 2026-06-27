import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1A3050',
          color: '#fff',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="4" fill="#C6912A" />
            <path
              d="M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"
              stroke="#1A3050"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ fontSize: 56 }}>Jolly Calendar</div>
        </div>
        <div style={{ fontSize: 30, color: '#C8D3E3', fontFamily: 'sans-serif' }}>
          상담 예약, 놓치지 않고 자동으로 관리하세요
        </div>
      </div>
    ),
    { ...size }
  );
}
