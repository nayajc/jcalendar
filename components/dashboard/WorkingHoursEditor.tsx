'use client';

import type { LawyerSettingsInput } from '@/lib/validators';

const DAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

type WorkingHours = LawyerSettingsInput['workingHours'];

interface WorkingHoursEditorProps {
  value: WorkingHours;
  onChange: (value: WorkingHours) => void;
}

export function WorkingHoursEditor({ value, onChange }: WorkingHoursEditorProps) {
  function updateDay(dayIndex: number, field: string, fieldValue: boolean | string) {
    onChange({
      ...value,
      [dayIndex]: {
        ...value[dayIndex],
        [field]: fieldValue,
      },
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {DAYS.map((day, i) => {
        const slot = value[i] ?? { enabled: false, start: '09:00', end: '18:00' };
        const isWeekend = i === 0 || i === 6;
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              background: slot.enabled ? 'var(--surface)' : 'var(--steel)',
              border: '1px solid',
              borderColor: slot.enabled ? 'var(--rule)' : 'transparent',
              transition: 'background 0.15s',
            }}
          >
            {/* Checkbox + day name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100px', flexShrink: 0 }}>
              <input
                type="checkbox"
                id={`day-${i}`}
                checked={slot.enabled}
                onChange={(e) => updateDay(i, 'enabled', e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--navy)', cursor: 'pointer' }}
              />
              <label
                htmlFor={`day-${i}`}
                style={{
                  fontSize: '14px',
                  fontWeight: slot.enabled ? 600 : 400,
                  color: slot.enabled ? 'var(--ink)' : 'var(--muted-light)',
                  cursor: 'pointer',
                  ...(isWeekend ? { color: slot.enabled ? '#DC2626' : 'var(--muted-light)' } : {}),
                }}
              >
                {day}
              </label>
            </div>

            {/* Time inputs */}
            {slot.enabled ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="time"
                  value={slot.start}
                  onChange={(e) => updateDay(i, 'start', e.target.value)}
                  className="field-input"
                  style={{ width: '130px', padding: '6px 10px', fontSize: '14px' }}
                />
                <span style={{ color: 'var(--muted)', fontSize: '13px', flexShrink: 0 }}>~</span>
                <input
                  type="time"
                  value={slot.end}
                  onChange={(e) => updateDay(i, 'end', e.target.value)}
                  className="field-input"
                  style={{ width: '130px', padding: '6px 10px', fontSize: '14px' }}
                />
              </div>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--muted-light)' }}>휴무</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
