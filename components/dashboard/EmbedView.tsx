'use client';

import { useLocale } from '@/lib/i18n/LocaleProvider';
import { CopyButton } from '@/app/(dashboard)/embed/CopyButton';

interface EmbedViewProps {
  widgetUrl: string;
  iframeCode: string;
}

export function EmbedView({ widgetUrl, iframeCode }: EmbedViewProps) {
  const { t } = useLocale();

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '36px' }}>
        <p className="section-eyebrow">{t('embed.eyebrow')}</p>
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif), Georgia, serif',
            fontSize: '32px',
            color: 'var(--navy)',
          }}
        >
          {t('embed.title')}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '8px' }}>
          {t('embed.subtitle')}
        </p>
      </div>

      <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Preview link */}
        <div className="card" style={{ background: 'var(--steel)', border: '1px solid var(--rule)' }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--slate-mid)',
              marginBottom: '8px',
            }}
          >
            {t('embed.previewUrl')}
          </p>
          <a
            href={widgetUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '14px',
              color: 'var(--slate-mid)',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
            }}
          >
            {widgetUrl}
          </a>
        </div>

        {/* Code snippet */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--rule)',
              background: 'var(--steel)',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              {t('embed.code')}
            </span>
            <CopyButton text={iframeCode} />
          </div>
          <pre
            style={{
              background: '#111827',
              color: '#D1FAE5',
              padding: '24px',
              fontSize: '13px',
              overflowX: 'auto',
              margin: 0,
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              fontFamily: '"SF Mono", "Fira Code", "Fira Mono", monospace',
            }}
          >
            {iframeCode}
          </pre>
        </div>

        {/* Instructions */}
        <div className="card">
          <h2
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              fontSize: '18px',
              color: 'var(--navy)',
              marginBottom: '16px',
            }}
          >
            {t('embed.instructions')}
          </h2>
          <ul
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              paddingLeft: '0',
              listStyle: 'none',
            }}
          >
            {[t('embed.step1'), t('embed.step2'), t('embed.step3')].map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '14px', color: 'var(--muted)', lineHeight: '1.6' }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: '20px',
                    height: '20px',
                    background: 'var(--steel)',
                    border: '1px solid var(--rule)',
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--slate-mid)',
                    marginTop: '1px',
                  }}
                >
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
            <li style={{ display: 'flex', gap: '10px', fontSize: '14px', color: 'var(--muted)', lineHeight: '1.6' }}>
              <span
                style={{
                  flexShrink: 0,
                  width: '20px',
                  height: '20px',
                  background: 'var(--steel)',
                  border: '1px solid var(--rule)',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--slate-mid)',
                  marginTop: '1px',
                }}
              >
                4
              </span>
              <span>
                {t('embed.step4Prefix')}{' '}
                <a href="/settings" style={{ color: 'var(--slate-mid)', fontWeight: 600 }}>
                  {t('embed.step4Link')}
                </a>
                {t('embed.step4Suffix')}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
