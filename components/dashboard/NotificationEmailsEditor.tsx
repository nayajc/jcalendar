'use client';

import { useState } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';

const MAX_RECIPIENTS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface NotificationEmailsEditorProps {
  value: string[];
  onChange: (emails: string[]) => void;
}

export function NotificationEmailsEditor({ value, onChange }: NotificationEmailsEditorProps) {
  const { t } = useLocale();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const addEmail = () => {
    const email = draft.trim().toLowerCase();
    if (!email) return;
    if (!EMAIL_RE.test(email)) {
      setError(t('notify.invalid'));
      return;
    }
    if (value.includes(email)) {
      setError(t('notify.duplicate'));
      return;
    }
    if (value.length >= MAX_RECIPIENTS) {
      setError(t('notify.max'));
      return;
    }
    onChange([...value, email]);
    setDraft('');
    setError('');
  };

  return (
    <div>
      {value.length === 0 && (
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
          {t('notify.empty')}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {value.map((email) => (
          <div
            key={email}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid var(--rule)',
              borderRadius: '8px',
              padding: '10px 14px',
              background: '#F8FAFC',
              fontSize: '14px',
            }}
          >
            <span>{email}</span>
            <button
              type="button"
              onClick={() => onChange(value.filter((e) => e !== email))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '18px', padding: '0 4px' }}
              aria-label={t('notify.deleteAria')}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="email"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addEmail();
            }
          }}
          placeholder={t('notify.placeholder')}
          className="field-input"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          onClick={addEmail}
          style={{
            padding: '8px 16px',
            border: '1px dashed var(--rule)',
            borderRadius: '8px',
            background: 'transparent',
            color: 'var(--navy)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          {t('notify.add')}
        </button>
      </div>
      {error && (
        <p style={{ fontSize: '13px', color: '#B91C1C', marginTop: '8px' }}>{error}</p>
      )}
    </div>
  );
}
