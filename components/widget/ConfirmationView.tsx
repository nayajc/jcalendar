'use client';

import { useLocale } from '@/lib/i18n/LocaleProvider';

interface ConfirmationViewProps {
  appointmentId: string;
  primaryColor?: string;
}

export function ConfirmationView({ appointmentId, primaryColor = '#1A3050' }: ConfirmationViewProps) {
  const { t } = useLocale();
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
        {t('confirm.title')}
      </h2>
      <p style={{ color: '#64748B', fontSize: '14px', margin: '0 0 8px', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
        {t('confirm.body')}
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
          {t('confirm.idLabel')}
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
        <strong style={{ display: 'block', marginBottom: '4px', color: '#1A3050' }}>{t('confirm.noticeTitle')}</strong>
        {t('confirm.noticeBody')}
      </div>
    </div>
  );
}
