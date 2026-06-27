'use client';

import { useState } from 'react';
import type { Appointment } from '@/types';

interface AppointmentListProps {
  appointments: Appointment[];
  lawyerTimezone: string;
}

function formatSlot(appointment: Appointment, timezone: string): string {
  const start = appointment.slotStart.toDate();
  const end = appointment.slotEnd.toDate();

  const fmt = new Intl.DateTimeFormat('ko-KR', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${fmt.format(start)} ~ ${new Intl.DateTimeFormat('ko-KR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(end)}`;
}

const STATUS_LABEL: Record<string, string> = {
  pending: '대기중',
  confirmed: '확정',
  rejected: '거절',
  expired: '만료',
  cancelled: '취소',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'badge badge-pending',
  confirmed: 'badge badge-confirmed',
  rejected: 'badge badge-rejected',
  expired: 'badge badge-expired',
  cancelled: 'badge badge-cancelled',
};

export default function AppointmentList({ appointments, lawyerTimezone }: AppointmentListProps) {
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
        throw new Error((data as { error?: string }).error ?? `${action} 실패`);
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
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
        해당 상태의 예약이 없습니다.
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
                  {STATUS_LABEL[appt.status] ?? appt.status}
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
                {formatSlot(appt, lawyerTimezone)}
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
                    {loading === `${appt.id}-confirm` ? '처리중...' : '승인'}
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
                    {loading === `${appt.id}-reject` ? '처리중...' : '거절'}
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
                  {loading === `${appt.id}-cancel` ? '처리중...' : '취소'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
