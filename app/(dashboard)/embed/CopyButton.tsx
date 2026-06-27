'use client';

import { useState } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={() => void handleCopy()}
      className="btn btn-sm"
      style={{
        background: copied ? 'var(--status-confirmed-bg)' : 'var(--navy)',
        color: copied ? 'var(--status-confirmed-text)' : '#fff',
        border: copied ? '1px solid rgba(6,95,70,0.2)' : '1px solid var(--navy)',
        fontWeight: 600,
        transition: 'background 0.2s, color 0.2s',
      }}
    >
      {copied ? t('embed.copied') : t('embed.copy')}
    </button>
  );
}
