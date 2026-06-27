'use client';

import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: '대시보드' },
  { href: '/appointments', label: '예약 관리' },
  { href: '/settings', label: '설정' },
  { href: '/embed', label: '위젯 임베드' },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {links.map((link) => {
        const active = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
        return (
          <a
            key={link.href}
            href={link.href}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: active ? 600 : 400,
              color: active ? '#fff' : 'rgba(255,255,255,0.65)',
              background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
              textDecoration: 'none',
              transition: 'background 0.15s, color 0.15s',
              borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {link.label}
          </a>
        );
      })}
    </div>
  );
}
