import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase/admin';
import LogoutButton from '@/components/dashboard/LogoutButton';
import NavLinks from '@/components/dashboard/NavLinks';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--steel)' }}>
      {/* Top Navigation */}
      <nav
        style={{
          background: 'var(--navy)',
          borderBottom: '3px solid var(--accent)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '60px',
          }}
        >
          {/* Brand */}
          <a
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect width="24" height="24" rx="4" fill="var(--accent)" />
              <path
                d="M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"
                stroke="#fff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                fontSize: '18px',
                color: '#fff',
                letterSpacing: '-0.01em',
              }}
            >
              JollySchedule
            </span>
          </a>

          {/* Nav Links - client component for active state */}
          <NavLinks />

          {/* User info + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span
              style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.6)',
                display: 'none',
              }}
              className="nav-email"
            >
              {user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '40px 24px',
        }}
      >
        {children}
      </main>
    </div>
  );
}
