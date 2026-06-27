'use client';

import { useLocale } from '@/lib/i18n/LocaleProvider';
import type { TranslationKey } from '@/lib/i18n/translations';

const STATUS_KEY: Record<string, TranslationKey> = {
  pending: 'status.pending',
  confirmed: 'status.confirmed',
  rejected: 'status.rejected',
  expired: 'status.expired',
  cancelled: 'status.cancelled',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'badge badge-pending',
  confirmed: 'badge badge-confirmed',
  rejected: 'badge badge-rejected',
  expired: 'badge badge-expired',
  cancelled: 'badge badge-cancelled',
};

interface AppointmentSummary {
  id: string;
  status?: string;
  client?: { name?: string };
}

interface DashboardViewProps {
  appointments: AppointmentSummary[];
  pending: number;
  confirmed: number;
}

export function DashboardView({ appointments, pending, confirmed }: DashboardViewProps) {
  const { t } = useLocale();

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '36px' }}>
        <p className="section-eyebrow">{t('dashboard.eyebrow')}</p>
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif), Georgia, serif',
            fontSize: '32px',
            color: 'var(--navy)',
          }}
        >
          {t('dashboard.title')}
        </h1>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '36px',
        }}
      >
        <StatCard label={t('dashboard.statPending')} value={pending} accent="var(--status-pending-text)" />
        <StatCard label={t('dashboard.statConfirmed')} value={confirmed} accent="var(--status-confirmed-text)" />
        <StatCard label={t('dashboard.statRecent')} value={appointments.length} accent="var(--slate-mid)" />
      </div>

      {/* Recent appointments */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid var(--rule)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              fontSize: '20px',
              color: 'var(--navy)',
            }}
          >
            {t('dashboard.recentAppointments')}
          </h2>
          <a href="/appointments" className="btn btn-secondary btn-sm">
            {t('dashboard.viewAll')}
          </a>
        </div>

        {appointments.length === 0 ? (
          <div
            style={{
              padding: '60px 28px',
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: '15px',
            }}
          >
            {t('dashboard.empty')}
          </div>
        ) : (
          <ul style={{ listStyle: 'none' }}>
            {appointments.map((appt, idx) => {
              const status = appt.status ?? 'unknown';
              const badgeClass = STATUS_CLASS[status] ?? 'badge';
              const statusKey = STATUS_KEY[status];
              return (
                <li
                  key={appt.id}
                  style={{
                    padding: '16px 28px',
                    borderBottom: idx < appointments.length - 1 ? '1px solid var(--rule)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <span className={badgeClass}>{statusKey ? t(statusKey) : status}</span>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {appt.client?.name ?? t('dashboard.unknownClient')}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--muted-light)',
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    #{appt.id.slice(0, 8)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <a href="/settings" className="btn btn-secondary">
          {t('dashboard.manageSettings')}
        </a>
        <a href="/embed" className="btn btn-secondary">
          {t('dashboard.embedCode')}
        </a>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div
      className="card"
      style={{
        padding: '24px 28px',
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
        {label}
      </p>
      <p
        style={{
          fontSize: '36px',
          fontWeight: 700,
          color: accent,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
    </div>
  );
}
