'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { clientAuth, clientDb } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import type { TranslationKey } from '@/lib/i18n/translations';
import type { LawyerSettingsInput } from '@/lib/validators';

const DAYS_ENABLED = [false, true, true, true, true, true, false]; // 일~토, 월~금 기본 활성화

const DEFAULT_WORKING_HOURS = Object.fromEntries(
  DAYS_ENABLED.map((enabled, i) => [
    i,
    { enabled, start: '09:00', end: '18:00' },
  ])
) as LawyerSettingsInput['workingHours'];

function mapFirebaseErrorKey(code: string): TranslationKey {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'signup.emailInUse';
    case 'auth/weak-password':
      return 'signup.weakPassword';
    case 'auth/invalid-email':
      return 'signup.invalidEmail';
    default:
      return 'signup.genericError';
  }
}

export default function SignupPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('signup.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(clientAuth, email, password);
      const uid = userCredential.user.uid;

      await setDoc(doc(clientDb, 'lawyers', uid), {
        id: uid,
        name,
        email,
        timezone: 'Asia/Seoul',
        slotLength: 60,
        bufferMinutes: 15,
        workingHours: DEFAULT_WORKING_HOURS,
        embedConfig: {},
        intakeQuestions: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const idToken = await userCredential.user.getIdToken();
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        throw new Error(t('login.sessionFailed'));
      }

      router.push('/settings');
    } catch (err) {
      if (err instanceof Error && 'code' in err) {
        setError(t(mapFirebaseErrorKey((err as { code: string }).code)));
      } else {
        setError(t('signup.genericError'));
      }
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
            {t('signup.title')}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
            {t('signup.subtitle')}
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label htmlFor="name" className="field-label">
              {t('signup.name')}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="field-input"
              placeholder={t('signup.namePlaceholder')}
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="email" className="field-label">
              {t('signup.email')}
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
              {t('signup.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="field-input"
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
              {t('signup.passwordHelper')}
            </p>
          </div>

          <div>
            <label htmlFor="confirm-password" className="field-label">
              {t('signup.confirmPassword')}
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="field-input"
              placeholder="••••••••"
              autoComplete="new-password"
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
            {loading ? t('signup.signingUp') : t('signup.signUp')}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', marginTop: '24px' }}>
        {t('signup.footer')}{' '}
        <Link href="/login" style={{ color: 'var(--slate-mid)', fontWeight: 600, textDecoration: 'none' }}>
          {t('signup.loginLink')}
        </Link>
      </p>
    </div>
  );
}
