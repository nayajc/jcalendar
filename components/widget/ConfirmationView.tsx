'use client';

interface ConfirmationViewProps {
  appointmentId: string;
  primaryColor?: string;
}

export function ConfirmationView({ appointmentId, primaryColor = '#1A3050' }: ConfirmationViewProps) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '40px 16px',
      }}
    >
      {/* Check icon */}
      <div
        style={{
          width: '72px',
          height: '72px',
          background: '#D1FAE5',
          border: '2px solid #A7F3D0',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '28px',
          color: '#065F46',
        }}
      >
        ✓
      </div>

      <h2
        style={{
          margin: '0 0 10px',
          fontSize: '22px',
          fontWeight: 700,
          color: '#0F1923',
          lineHeight: 1.3,
        }}
      >
        예약 신청이 완료되었습니다
      </h2>
      <p style={{ color: '#64748B', fontSize: '14px', margin: '0 0 8px', lineHeight: 1.7 }}>
        담당 변호사가 검토 후 확정 이메일을 발송합니다.
        <br />
        통상 영업일 기준 1일 이내 처리됩니다.
      </p>

      {/* Appointment ID */}
      <div
        style={{
          display: 'inline-block',
          background: '#F8FAFC',
          border: '1px solid #E8EDF4',
          borderRadius: '8px',
          padding: '10px 20px',
          marginTop: '20px',
          fontSize: '12px',
          color: '#94A3B8',
          lineHeight: 1.5,
        }}
      >
        <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>
          예약 번호
        </span>
        <span
          style={{
            fontFamily: '"SF Mono", "Fira Code", monospace',
            color: '#64748B',
            fontSize: '13px',
            wordBreak: 'break-all',
          }}
        >
          {appointmentId}
        </span>
      </div>

      <div
        style={{
          marginTop: '28px',
          padding: '14px 16px',
          background: '#EDF1F7',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#3D5A80',
          lineHeight: 1.6,
          textAlign: 'left',
        }}
      >
        <strong style={{ display: 'block', marginBottom: '4px', color: '#1A3050' }}>안내사항</strong>
        확정 이메일 수신 후 예약이 유효합니다. 부득이하게 취소가 필요할 경우,
        이메일로 사무소에 연락 바랍니다.
      </div>
    </div>
  );
}
