'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { clientAuth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
      const idToken = await userCredential.user.getIdToken();

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        throw new Error('세션 생성에 실패했습니다');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '400px',
      }}
    >
      <div className="card" style={{ padding: '40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              fontSize: '26px',
              color: 'var(--navy)',
              marginBottom: '6px',
            }}
          >
            변호사 로그인
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
            계정 정보를 입력하여 대시보드에 접속하세요.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label htmlFor="email" className="field-label">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="field-input"
              placeholder="lawyer@lawfirm.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="field-label">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="field-input"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '13px 20px', fontSize: '15px', marginTop: '4px' }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted-light)', marginTop: '24px' }}>
        본 시스템은 등록된 변호사만 접속 가능합니다.
      </p>
    </div>
  );
}
