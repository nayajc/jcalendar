'use client';

import { useState } from 'react';
import type { ClientAppointment } from '@/types';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import type { TranslationKey } from '@/lib/i18n/translations';

interface AppointmentListProps {
  appointments: ClientAppointment[];
  lawyerTimezone: string;
}

function formatSlot(appointment: ClientAppointment, timezone: string, locale: string): string {
  const start = new Date(appointment.slotStart);
  const end = new Date(appointment.slotEnd);
  const intlLocale = locale === 'en' ? 'en-US' : 'ko-KR';

  const fmt = new Intl.DateTimeFormat(intlLocale, {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${fmt.format(start)} ~ ${new Intl.DateTimeFormat(intlLocale, {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(end)}`;
}

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

export default function AppointmentList({ appointments, lawyerTimezone }: AppointmentListProps) {
  const { t, locale } = useLocale();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function callAction(appointmentId: string, action: 'confirm' | 'reject' | 'cancel') {
    setLoading(`${appointmentId}-${action}`);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/${action}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `${action} ${t('apptList.actionFailedSuffix')}`);
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('apptList.genericError'));
    } finally {
      setLoading(null);
    }
  }

  if (appointments.length === 0) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--rule)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px 28px',
          textAlign: 'center',
          color: 'var(--muted)',
          fontSize: '14px',
        }}
      >
        {t('apptList.empty')}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '12px' }} role="alert">
          {error}
        </div>
      )}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--rule)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {appointments.map((appt, idx) => (
          <div
            key={appt.id}
            style={{
              padding: '20px 24px',
              borderBottom: idx < appointments.length - 1 ? '1px solid var(--rule)' : 'none',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            {/* Left: info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Top row: badge + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span className={STATUS_CLASS[appt.status] ?? 'badge'}>
                  {STATUS_KEY[appt.status] ? t(STATUS_KEY[appt.status]!) : appt.status}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>
                  {appt.client.name}
                </span>
              </div>

              {/* Datetime */}
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--navy)',
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums',
                  marginBottom: '4px',
                }}
              >
                {formatSlot(appt, lawyerTimezone, locale)}
              </p>

              {/* Contact */}
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
                {appt.client.email} · {appt.client.phone}
              </p>

              {/* Inquiry */}
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--ink)',
                  lineHeight: '1.6',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  background: 'var(--steel)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid var(--rule)',
                }}
              >
                {appt.inquiry}
              </p>

              {/* Intake answers */}
              {appt.intakeAnswers && appt.intakeAnswers.length > 0 && (
                <div
                  style={{
                    marginTop: '8px',
                    background: '#F8FAFC',
                    border: '1px solid var(--rule)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                  }}
                >
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    {t('apptList.intakeAnswers')}
                  </p>
                  {appt.intakeAnswers.map((ans) => (
                    <div key={ans.questionId} style={{ marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--navy)' }}>{ans.label}: </span>
                      <span style={{ fontSize: '12px', color: 'var(--ink)' }}>{ans.answer}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Attachments */}
              {appt.attachments && appt.attachments.length > 0 && (
                <div
                  style={{
                    marginTop: '8px',
                    background: '#F8FAFC',
                    border: '1px solid var(--rule)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                  }}
                >
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    {t('apptList.attachments')}
                  </p>
                  {appt.attachments.map((att, i) => (
                    <div key={i} style={{ marginBottom: '4px' }}>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '13px', color: 'var(--navy)', textDecoration: 'underline', fontWeight: 500 }}
                      >
                        {att.name}
                      </a>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '6px' }}>
                        ({(att.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
              {appt.status === 'pending' && (
                <>
                  <button
                    onClick={() => void callAction(appt.id, 'confirm')}
                    disabled={loading !== null}
                    className="btn btn-sm"
                    style={{
                      background: 'var(--status-confirmed-bg)',
                      color: 'var(--status-confirmed-text)',
                      border: '1px solid rgba(6,95,70,0.2)',
                      fontWeight: 700,
                    }}
                  >
                    {loading === `${appt.id}-confirm` ? t('apptList.processing') : t('apptList.confirm')}
                  </button>
                  <button
                    onClick={() => void callAction(appt.id, 'reject')}
                    disabled={loading !== null}
                    className="btn btn-sm"
                    style={{
                      background: '#FEF2F2',
                      color: '#991B1B',
                      border: '1px solid rgba(153,27,27,0.2)',
                      fontWeight: 700,
                    }}
                  >
                    {loading === `${appt.id}-reject` ? t('apptList.processing') : t('apptList.reject')}
                  </button>
                </>
              )}
              {appt.status === 'confirmed' && (
                <button
                  onClick={() => void callAction(appt.id, 'cancel')}
                  disabled={loading !== null}
                  className="btn btn-sm btn-ghost"
                  style={{ color: 'var(--muted)', border: '1px solid var(--rule)' }}
                >
                  {loading === `${appt.id}-cancel` ? t('apptList.processing') : t('apptList.cancel')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
