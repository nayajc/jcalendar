'use client';

import { useState } from 'react';
import { WorkingHoursEditor } from '@/components/dashboard/WorkingHoursEditor';
import type { LawyerSettingsInput } from '@/lib/validators';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const DEFAULT_WORKING_HOURS = Object.fromEntries(
  DAYS.map((_, i) => [
    i,
    {
      enabled: i >= 1 && i <= 5,
      start: '09:00',
      end: '18:00',
    },
  ])
);

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<LawyerSettingsInput>>({
    slotLength: 60,
    bufferMinutes: 15,
    timezone: 'Asia/Seoul',
    workingHours: DEFAULT_WORKING_HOURS as LawyerSettingsInput['workingHours'],
    embedConfig: {},
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch('/api/lawyers/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? '저장에 실패했습니다');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '36px' }}>
        <p className="section-eyebrow">환경설정</p>
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif), Georgia, serif',
            fontSize: '32px',
            color: 'var(--navy)',
          }}
        >
          설정
        </h1>
      </div>

      <form onSubmit={(e) => void handleSave(e)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Basic settings */}
        <div className="card">
          <h2
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              fontSize: '20px',
              color: 'var(--navy)',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--rule)',
            }}
          >
            기본 설정
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
            }}
          >
            <div>
              <label className="field-label" htmlFor="slot-length">
                슬롯 길이
              </label>
              <select
                id="slot-length"
                value={settings.slotLength}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, slotLength: Number(e.target.value) }))
                }
                className="field-input"
              >
                {[30, 45, 60, 90, 120].map((v) => (
                  <option key={v} value={v}>
                    {v}분
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label" htmlFor="buffer">
                슬롯 간 버퍼
              </label>
              <select
                id="buffer"
                value={settings.bufferMinutes}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, bufferMinutes: Number(e.target.value) }))
                }
                className="field-input"
              >
                {[0, 10, 15, 30].map((v) => (
                  <option key={v} value={v}>
                    {v}분
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label" htmlFor="timezone">
                타임존
              </label>
              <select
                id="timezone"
                value={settings.timezone}
                onChange={(e) => setSettings((s) => ({ ...s, timezone: e.target.value }))}
                className="field-input"
              >
                <option value="Asia/Seoul">Asia/Seoul (KST)</option>
                <option value="America/New_York">America/New_York (ET)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Working hours */}
        <div className="card">
          <h2
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              fontSize: '20px',
              color: 'var(--navy)',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--rule)',
            }}
          >
            업무시간
          </h2>
          <WorkingHoursEditor
            value={settings.workingHours ?? (DEFAULT_WORKING_HOURS as LawyerSettingsInput['workingHours'])}
            onChange={(wh) => setSettings((s) => ({ ...s, workingHours: wh }))}
          />
        </div>

        {/* Embed config */}
        <div className="card">
          <h2
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              fontSize: '20px',
              color: 'var(--navy)',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--rule)',
            }}
          >
            임베드 위젯 설정
          </h2>
          <div>
            <label className="field-label" htmlFor="custom-message">
              위젯 안내 문구 (선택)
            </label>
            <textarea
              id="custom-message"
              value={settings.embedConfig?.customMessage ?? ''}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  embedConfig: { ...s.embedConfig, customMessage: e.target.value },
                }))
              }
              rows={3}
              className="field-input"
              style={{ resize: 'vertical' }}
              placeholder="위젯 상단에 표시될 안내 메시지를 입력하세요"
            />
          </div>
        </div>

        {/* Google Calendar */}
        <div className="card">
          <h2
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              fontSize: '20px',
              color: 'var(--navy)',
              marginBottom: '8px',
            }}
          >
            Google Calendar 연동
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
            Google Calendar를 연결하면 바쁜 시간이 자동으로 제외됩니다.
          </p>
          <a href="/settings/google-calendar" className="btn btn-secondary">
            Google Calendar 연결 관리
          </a>
        </div>

        {/* Feedback */}
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
        {saved && (
          <div className="alert alert-success" role="status">
            설정이 저장되었습니다.
          </div>
        )}

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '12px 32px', fontSize: '15px' }}
          >
            {loading ? '저장 중...' : '설정 저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
