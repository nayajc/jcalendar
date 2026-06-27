import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { redirect } from 'next/navigation';

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

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    redirect('/login');
  }

  let lawyerId: string;
  try {
    const claims = await adminAuth.verifySessionCookie(sessionCookie, true);
    lawyerId = claims.uid;
  } catch {
    redirect('/login');
  }

  const appointmentsSnap = await adminDb
    .collection('appointments')
    .where('lawyerId', '==', lawyerId)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  const appointments = appointmentsSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as { status?: string; client?: { name?: string }; slotStart?: { toDate: () => Date } }),
  }));

  const pending = appointments.filter((a) => a.status === 'pending').length;
  const confirmed = appointments.filter((a) => a.status === 'confirmed').length;

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '36px' }}>
        <p className="section-eyebrow">개요</p>
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif), Georgia, serif',
            fontSize: '32px',
            color: 'var(--navy)',
          }}
        >
          예약 대시보드
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
        <StatCard label="대기중 예약" value={pending} accent="var(--status-pending-text)" />
        <StatCard label="확정 예약" value={confirmed} accent="var(--status-confirmed-text)" />
        <StatCard label="최근 10건" value={appointments.length} accent="var(--slate-mid)" />
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
            최근 예약
          </h2>
          <a href="/appointments" className="btn btn-secondary btn-sm">
            전체 보기
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
            아직 예약이 없습니다.
          </div>
        ) : (
          <ul style={{ listStyle: 'none' }}>
            {appointments.map((appt, idx) => {
              const status = appt.status ?? 'unknown';
              const badgeClass = STATUS_CLASS[status] ?? 'badge';
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
                    <span className={badgeClass}>{STATUS_LABEL[status] ?? status}</span>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {appt.client?.name ?? '알 수 없음'}
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
          설정 관리
        </a>
        <a href="/embed" className="btn btn-secondary">
          위젯 임베드 코드
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
