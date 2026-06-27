'use client';

import type { IntakeQuestion } from '@/types';
import { useLocale } from '@/lib/i18n/LocaleProvider';

interface IntakeQuestionsEditorProps {
  value: IntakeQuestion[];
  onChange: (questions: IntakeQuestion[]) => void;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function IntakeQuestionsEditor({ value, onChange }: IntakeQuestionsEditorProps) {
  const { t } = useLocale();
  const addQuestion = () => {
    onChange([...value, { id: generateId(), label: '', required: false }]);
  };

  const removeQuestion = (id: string) => {
    onChange(value.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, patch: Partial<IntakeQuestion>) => {
    onChange(value.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const moveQuestion = (id: string, dir: -1 | 1) => {
    const idx = value.findIndex((q) => q.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= value.length) return;
    const arr = [...value];
    [arr[idx], arr[newIdx]] = [arr[newIdx]!, arr[idx]!];
    onChange(arr);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
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
          {t('intake.empty')}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        {value.map((q, idx) => (
          <div
            key={q.id}
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
            {/* Reorder buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0, paddingTop: '4px' }}>
              <button
                type="button"
                onClick={() => moveQuestion(q.id, -1)}
                disabled={idx === 0}
                style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? '#CBD5E1' : '#64748B', fontSize: '14px', padding: '2px 4px' }}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveQuestion(q.id, 1)}
                disabled={idx === value.length - 1}
                style={{ background: 'none', border: 'none', cursor: idx === value.length - 1 ? 'default' : 'pointer', color: idx === value.length - 1 ? '#CBD5E1' : '#64748B', fontSize: '14px', padding: '2px 4px' }}
              >
                ▼
              </button>
            </div>

            {/* Question input */}
            <div style={{ flex: 1 }}>
              <input
                type="text"
                value={q.label}
                onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                placeholder={t('intake.placeholder')}
                style={inputStyle}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '13px', color: 'var(--muted)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                />
                {t('intake.required')}
              </label>
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => removeQuestion(q.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '18px', padding: '4px', flexShrink: 0 }}
              aria-label={t('intake.deleteAria')}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addQuestion}
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
        {t('intake.add')}
      </button>
    </div>
  );
}
