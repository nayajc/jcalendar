'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { clientAuth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n/LocaleProvider';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLocale();
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
        throw new Error(t('login.sessionFailed'));
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.invalidCredentials'));
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
            {t('login.title')}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
            {t('login.subtitle')}
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label htmlFor="email" className="field-label">
              {t('login.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="field-input"
              placeholder="consultant@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="field-label">
              {t('login.password')}
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
            {loading ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', marginTop: '24px' }}>
        {t('login.footer')}{' '}
        <Link href="/signup" style={{ color: 'var(--slate-mid)', fontWeight: 600, textDecoration: 'none' }}>
          {t('login.signupLink')}
        </Link>
      </p>
    </div>
  );
}
