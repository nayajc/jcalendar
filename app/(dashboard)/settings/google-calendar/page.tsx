import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { generateAuthUrl } from '@/lib/google-calendar/client';
import { redirect } from 'next/navigation';
import type { Lawyer } from '@/types';

export default async function GoogleCalendarSettingsPage() {
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

  const lawyerDoc = await adminDb.collection('lawyers').doc(lawyerId).get();
  const lawyer = lawyerDoc.exists ? ({ id: lawyerId, ...lawyerDoc.data() } as Lawyer) : null;
  const isConnected = Boolean(lawyer?.googleCalendar?.calendarId);

  const authUrl = generateAuthUrl(lawyerId);

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
          ← 설정으로 돌아가기
        </a>
        <p className="section-eyebrow">연동</p>
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif), Georgia, serif',
            fontSize: '32px',
            color: 'var(--navy)',
          }}
        >
          Google Calendar 연결
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
              {isConnected ? 'Google Calendar 연결됨' : '연결되지 않음'}
            </p>
            {isConnected && lawyer?.googleCalendar?.calendarId && (
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--muted)',
                  fontFamily: 'monospace',
                  marginTop: '2px',
                }}
              >
                {lawyer.googleCalendar.calendarId}
              </p>
            )}
          </div>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.7', marginBottom: '24px' }}>
          Google Calendar를 연결하면 귀하의 캘린더에 등록된 일정이 가용 슬롯에서 자동으로
          제외됩니다. 확정된 예약은 Google Calendar에 자동 추가됩니다.
        </p>

        <a
          href={authUrl}
          className="btn btn-primary"
          style={{ padding: '12px 24px' }}
        >
          {isConnected ? 'Google Calendar 재연결' : 'Google Calendar 연결하기'}
        </a>
      </div>
    </div>
  );
}
