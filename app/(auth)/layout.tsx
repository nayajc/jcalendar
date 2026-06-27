const STATS = [
  { value: '0%', label: '이중예약 발생률', detail: 'Google Calendar와 실시간 동기화' },
  { value: '24/7', label: '자동 예약 접수', detail: '상담사가 자리에 없어도 예약 가능' },
  { value: '< 1분', label: '예약 확정 알림', detail: '승인 즉시 이메일 자동 발송' },
];

const FEATURES = [
  '이중예약 방지 — 슬롯 잠금으로 동시 예약 충돌 차단',
  'Google Calendar 양방향 연동 — 바쁜 시간 자동 제외',
  '어디든 임베드 가능한 예약 위젯 (iframe)',
  '24h/1h 전 리마인더 이메일 자동 발송',
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--steel)',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1080px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '56px',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Left: brand + pitch + stats */}
        <div style={{ flex: '1 1 420px', maxWidth: '480px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            {/* Calendar icon — inline SVG, no CDN */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            >
              <rect width="24" height="24" rx="4" fill="var(--navy)" />
              <path
                d="M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                fontSize: '22px',
                color: 'var(--navy)',
                letterSpacing: '-0.02em',
              }}
            >
              JollySchedule
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              fontSize: '32px',
              color: 'var(--navy)',
              marginBottom: '12px',
              lineHeight: 1.3,
            }}
          >
            상담 예약, 놓치지 않고
            <br />
            자동으로 관리하세요
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: 'var(--muted)',
              lineHeight: 1.7,
              marginBottom: '32px',
            }}
          >
            Google Calendar와 연동된 예약 캘린더로 이중예약 걱정 없이,
            의뢰부터 확정까지 전 과정을 자동화합니다.
          </p>

          {/* Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '12px',
              marginBottom: '32px',
            }}
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                className="card-tight"
                style={{ textAlign: 'center', padding: '16px 10px' }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-dm-serif), Georgia, serif',
                    fontSize: '22px',
                    color: 'var(--accent-dim)',
                    marginBottom: '4px',
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)', marginBottom: '4px' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted-light)', lineHeight: 1.4 }}>
                  {s.detail}
                </div>
              </div>
            ))}
          </div>

          {/* Feature list */}
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', listStyle: 'none' }}>
            {FEATURES.map((f) => (
              <li
                key={f}
                style={{
                  display: 'flex',
                  gap: '10px',
                  fontSize: '13px',
                  color: 'var(--muted)',
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'var(--steel-dark)',
                    color: 'var(--navy)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    marginTop: '1px',
                  }}
                >
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: login card */}
        <div style={{ flex: '0 1 400px' }}>{children}</div>
      </div>
    </div>
  );
}
