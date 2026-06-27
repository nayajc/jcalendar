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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--steel)',
        padding: '24px 16px',
      }}
    >
      {/* Brand mark */}
      <div style={{ marginBottom: '36px', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {/* Scale of justice icon — inline SVG, no CDN */}
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
              d="M12 4v16M8 20h8M6 8l6-1 6 1M6 8l-2 4h4L6 8zM18 8l-2 4h4L18 8z"
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
            LexSchedule
          </span>
        </div>
        <p
          style={{
            marginTop: '8px',
            fontSize: '13px',
            color: 'var(--muted)',
            letterSpacing: '0.04em',
          }}
        >
          법률 상담 예약 관리 시스템
        </p>
      </div>
      {children}
    </div>
  );
}
