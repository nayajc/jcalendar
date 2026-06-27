'use client';

import { useState } from 'react';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } finally {
      window.location.href = '/login';
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={loading}
      style={{
        padding: '6px 14px',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 500,
        color: 'rgba(255,255,255,0.75)',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.5 : 1,
        transition: 'background 0.15s, border-color 0.15s',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.4)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)';
      }}
    >
      {loading ? '로그아웃 중...' : '로그아웃'}
    </button>
  );
}
