'use client';

import { useLocale } from '@/lib/i18n/LocaleProvider';

interface GoogleCalendarViewProps {
  isConnected: boolean;
  calendarId?: string;
  authUrl: string;
}

export function GoogleCalendarView({ isConnected, calendarId, authUrl }: GoogleCalendarViewProps) {
  const { t } = useLocale();

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '36px' }}>
        <a
          href="/settings"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--muted)',
            textDecoration: 'none',
            marginBottom: '12px',
          }}
        >
          {t('gcal.back')}
        </a>
        <p className="section-eyebrow">{t('gcal.eyebrow')}</p>
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif), Georgia, serif',
            fontSize: '32px',
            color: 'var(--navy)',
          }}
        >
          {t('gcal.title')}
        </h1>
      </div>

      <div className="card" style={{ maxWidth: '560px' }}>
        {/* Connection status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            background: isConnected ? 'var(--status-confirmed-bg)' : 'var(--steel)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isConnected ? 'var(--status-confirmed-text)' : 'var(--muted-light)',
              flexShrink: 0,
            }}
          />
          <div>
            <p
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: isConnected ? 'var(--status-confirmed-text)' : 'var(--muted)',
              }}
            >
              {isConnected ? t('gcal.connected') : t('gcal.notConnected')}
            </p>
            {isConnected && calendarId && (
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--muted)',
                  fontFamily: 'monospace',
                  marginTop: '2px',
                }}
              >
                {calendarId}
              </p>
            )}
          </div>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.7', marginBottom: '24px' }}>
          {t('gcal.description')}
        </p>

        <a
          href={authUrl}
          className="btn btn-primary"
          style={{ padding: '12px 24px' }}
        >
          {isConnected ? t('gcal.reconnect') : t('gcal.connect')}
        </a>
      </div>
    </div>
  );
}
