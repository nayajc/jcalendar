import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { lawyerConverter } from '@/lib/firebase/converters';
import { redirect } from 'next/navigation';
import { CopyButton } from './CopyButton';

async function getLawyerId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decoded.uid;
  } catch {
    return null;
  }
}

export default async function EmbedPage() {
  const lawyerId = await getLawyerId();
  if (!lawyerId) {
    redirect('/login');
  }

  const lawyerSnap = await adminDb
    .collection('lawyers')
    .withConverter(lawyerConverter)
    .doc(lawyerId)
    .get();

  const lawyer = lawyerSnap.data();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://your-domain.com';
  const widgetUrl = `${baseUrl}/widget/${lawyerId}`;

  const iframeCode = `<iframe
  src="${widgetUrl}"
  width="100%"
  height="700"
  frameborder="0"
  style="border-radius: 8px; border: 1px solid #C8D3E3;"
  title="${lawyer?.name ?? '변호사'} 상담 예약"
></iframe>`;

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '36px' }}>
        <p className="section-eyebrow">배포</p>
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif), Georgia, serif',
            fontSize: '32px',
            color: 'var(--navy)',
          }}
        >
          예약 위젯 임베드
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '8px' }}>
          아래 HTML 코드를 귀 사무소 홈페이지에 붙여넣으면 예약 위젯이 표시됩니다.
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
            위젯 미리보기 URL
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
              임베드 코드
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
            사용 안내
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
            {[
              '위젯은 iframe으로 모든 도메인에서 임베드 가능합니다.',
              '상담자의 브라우저 타임존에 맞춰 시각이 자동 표시됩니다.',
              '예약 신청 시 귀하의 이메일로 알림이 발송됩니다.',
            ].map((item, i) => (
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
                위젯 안내 문구는{' '}
                <a href="/settings" style={{ color: 'var(--slate-mid)', fontWeight: 600 }}>
                  설정 페이지
                </a>
                에서 변경할 수 있습니다.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
