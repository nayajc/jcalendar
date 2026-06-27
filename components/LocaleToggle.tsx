'use client';

import { useLocale } from '@/lib/i18n/LocaleProvider';

export function LocaleToggle({ dark = false }: { dark?: boolean }) {
  const { locale, toggleLocale, t } = useLocale();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={t('locale.toggleAria')}
      style={{
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        cursor: 'pointer',
        fontFamily: 'inherit',
        border: dark ? '1px solid rgba(255,255,255,0.25)' : '1px solid var(--rule)',
        background: dark ? 'transparent' : '#fff',
        color: dark ? 'rgba(255,255,255,0.85)' : 'var(--navy)',
      }}
    >
      {locale === 'ko' ? 'KO / EN' : 'EN / KO'}
    </button>
  );
}
