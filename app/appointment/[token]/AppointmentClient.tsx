'use client';

import { useState } from 'react';

interface AppointmentData {
  id: string;
  status: string;
  lawyerName: string;
  slotStartFormatted: string;
  slotEndFormatted: string;
  clientTimezone: string;
  inquiry: string;
  clientName: string;
  cancelledBy?: string;
}

interface Props {
  token: string;
  initialData: AppointmentData;
}

const STATUS_LABELS: Record<string, string> = {
  pending: '승인 대기 중',
  confirmed: '예약 확정',
  cancelled: '취소됨',
  expired: '만료됨',
  rejected: '거절됨',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#b45309',
  confirmed: '#166534',
  cancelled: '#6b7280',
  expired: '#6b7280',
  rejected: '#991b1b',
};

export default function AppointmentClient({ token, initialData }: Props) {
  const [data, setData] = useState<AppointmentData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);

  const canCancel = data.status === 'pending' || data.status === 'confirmed';

  async function handleCancel() {
    if (!confirm('예약을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/appointment/${token}`, {
        method: 'POST',
      });

      if (res.status === 409) {
        const body = await res.json() as { error?: string };
        setError(body.error ?? '이미 처리된 예약입니다.');
        setData((prev) => ({ ...prev, status: 'cancelled' }));
        return;
      }

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        setError(body.error ?? '취소 중 오류가 발생했습니다.');
        return;
      }

      setCancelled(true);
      setData((prev) => ({ ...prev, status: 'cancelled' }));
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  const statusLabel = STATUS_LABELS[data.status] ?? data.status;
  const statusColor = STATUS_COLORS[data.status] ?? '#374151';

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoMark}>법률 상담</div>
          <h1 style={styles.title}>내 예약 확인</h1>
        </div>

        {/* Status badge */}
        <div style={{ ...styles.statusBadge, borderColor: statusColor }}>
          <span style={{ ...styles.statusDot, backgroundColor: statusColor }} />
          <span style={{ ...styles.statusText, color: statusColor }}>
            {statusLabel}
          </span>
        </div>

        {/* Reservation details */}
        <div style={styles.section}>
          <div style={styles.row}>
            <span style={styles.label}>담당 변호사</span>
            <span style={styles.value}>{data.lawyerName}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>상담 일시</span>
            <span style={styles.value}>{data.slotStartFormatted}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>상담 종료</span>
            <span style={styles.value}>{data.slotEndFormatted}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>문의 내용</span>
            <span style={{ ...styles.value, whiteSpace: 'pre-wrap' }}>
              {data.inquiry}
            </span>
          </div>
        </div>

        {/* Cancel section */}
        {cancelled ? (
          <div style={styles.successBox}>
            예약이 정상적으로 취소되었습니다. 확인 이메일이 발송됩니다.
          </div>
        ) : canCancel ? (
          <div style={styles.actionSection}>
            {error && <p style={styles.errorText}>{error}</p>}
            <button
              onClick={handleCancel}
              disabled={loading}
              style={{ ...styles.cancelButton, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? '취소 처리 중...' : '예약 취소'}
            </button>
            <p style={styles.cautionText}>
              취소 후에는 되돌릴 수 없습니다.
            </p>
          </div>
        ) : (
          <div style={styles.infoBox}>
            {data.status === 'cancelled' &&
              `이 예약은 ${data.cancelledBy === 'lawyer' ? '변호사에 의해' : '귀하에 의해'} 취소된 예약입니다.`}
            {data.status === 'expired' && '이 예약은 기간이 만료되었습니다.'}
            {data.status === 'rejected' && '이 예약은 변호사에 의해 거절되었습니다.'}
          </div>
        )}

        <div style={styles.footer}>
          상담 일정 관련 문의는 담당 변호사에게 직접 연락해 주세요.
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '520px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#1e3a5f',
    padding: '32px 32px 24px',
  },
  logoMark: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#b8972a',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '20px 32px 0',
    padding: '8px 14px',
    border: '1px solid',
    borderRadius: '6px',
    width: 'fit-content',
    backgroundColor: '#fafafa',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  statusText: {
    fontSize: '14px',
    fontWeight: '600',
  },
  section: {
    padding: '24px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    borderBottom: '1px solid #f1f5f9',
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  value: {
    fontSize: '15px',
    color: '#1e293b',
    lineHeight: '1.5',
  },
  actionSection: {
    padding: '24px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cancelButton: {
    width: '100%',
    padding: '13px',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  cautionText: {
    fontSize: '12px',
    color: '#94a3b8',
    textAlign: 'center',
    margin: 0,
  },
  errorText: {
    fontSize: '14px',
    color: '#dc2626',
    margin: 0,
  },
  successBox: {
    margin: '24px 32px',
    padding: '16px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#166534',
    lineHeight: '1.5',
  },
  infoBox: {
    margin: '24px 32px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#64748b',
    lineHeight: '1.5',
  },
  footer: {
    padding: '16px 32px 24px',
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.5',
  },
};
