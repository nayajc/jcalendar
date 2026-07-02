'use client';

import type { BlockedPeriod } from '@/types';
import { useLocale } from '@/lib/i18n/LocaleProvider';

interface BlockedPeriodsEditorProps {
  value: BlockedPeriod[];
  onChange: (periods: BlockedPeriod[]) => void;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function BlockedPeriodsEditor({ value, onChange }: BlockedPeriodsEditorProps) {
  const { t } = useLocale();

  const addPeriod = () => {
    const today = todayString();
    onChange([...value, { id: generateId(), startDate: today, endDate: today, label: '' }]);
  };

  const removePeriod = (id: string) => {
    onChange(value.filter((p) => p.id !== id));
  };

  const updatePeriod = (id: string, patch: Partial<BlockedPeriod>) => {
    onChange(
      value.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...patch };
        // endDate는 startDate보다 이전일 수 없음
        if (patch.startDate && updated.endDate < patch.startDate) {
          updated.endDate = patch.startDate;
        }
        return updated;
      })
    );
  };

  const inputStyle: React.CSSProperties = {
    border: '1px solid var(--rule)',
    borderRadius: '8px',
    padding: '9px 12px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    color: 'var(--ink)',
    background: '#fff',
  };

  return (
    <div>
      {value.length === 0 && (
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
          {t('blocked.empty')}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        {value.map((p) => (
          <div
            key={p.id}
            style={{
              border: '1px solid var(--rule)',
              borderRadius: '8px',
              padding: '14px',
              background: '#F8FAFC',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}
          >
            {/* Date inputs */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Date row */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>
                    {t('blocked.startDate')}
                  </label>
                  <input
                    type="date"
                    value={p.startDate}
                    onChange={(e) => updatePeriod(p.id, { startDate: e.target.value })}
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600 }}>
                    {t('blocked.endDate')}
                  </label>
                  <input
                    type="date"
                    value={p.endDate}
                    min={p.startDate}
                    onChange={(e) => updatePeriod(p.id, { endDate: e.target.value })}
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </div>
              </div>
              {/* Label input */}
              <input
                type="text"
                value={p.label ?? ''}
                onChange={(e) => updatePeriod(p.id, { label: e.target.value })}
                placeholder={t('blocked.labelPlaceholder')}
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => removePeriod(p.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '18px', padding: '4px', flexShrink: 0, marginTop: '18px' }}
              aria-label={t('blocked.deleteAria')}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addPeriod}
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
        }}
      >
        {t('blocked.add')}
      </button>
    </div>
  );
}
