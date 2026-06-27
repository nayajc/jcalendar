'use client';

import { useState, useEffect } from 'react';
import { WorkingHoursEditor } from '@/components/dashboard/WorkingHoursEditor';
import { IntakeQuestionsEditor } from '@/components/dashboard/IntakeQuestionsEditor';
import type { LawyerSettingsInput } from '@/lib/validators';
import type { IntakeQuestion } from '@/types';
import { useLocale } from '@/lib/i18n/LocaleProvider';

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
  const { t } = useLocale();
  const [settings, setSettings] = useState<Partial<LawyerSettingsInput>>({
    name: '',
    slotLength: 60,
    bufferMinutes: 15,
    timezone: 'Asia/Seoul',
    workingHours: DEFAULT_WORKING_HOURS as LawyerSettingsInput['workingHours'],
    embedConfig: {},
    intakeQuestions: [],
  });
  const [loading, setLoading] = useState(false);

  // 기존 설정 불러오기 (저장 시 기본값으로 덮어쓰지 않도록)
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/lawyers/settings');
        if (!res.ok) return;
        const json = (await res.json()) as { data?: Partial<LawyerSettingsInput> | null };
        if (json.data) {
          setSettings((s) => ({
            ...s,
            ...json.data,
            embedConfig: { ...s.embedConfig, ...(json.data?.embedConfig ?? {}) },
            workingHours: json.data?.workingHours ?? s.workingHours,
            intakeQuestions: json.data?.intakeQuestions ?? s.intakeQuestions,
          }));
        }
      } catch {
        // 로드 실패 시 기본값 유지
      }
    })();
  }, []);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/lawyers/logo', { method: 'POST', body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? t('settings.logoUploadFailed'));
      setSettings((s) => ({ ...s, embedConfig: { ...s.embedConfig, logoUrl: data.url } }));
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : t('settings.logoUploadFailed'));
    } finally {
      setLogoUploading(false);
    }
  }

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
        throw new Error(data.error ?? t('settings.saveFailed'));
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  const cardHeadingStyle: React.CSSProperties = {
    fontFamily: 'var(--font-dm-serif), Georgia, serif',
    fontSize: '20px',
    color: 'var(--navy)',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--rule)',
  };

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '36px' }}>
        <p className="section-eyebrow">{t('settings.eyebrow')}</p>
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif), Georgia, serif',
            fontSize: '32px',
            color: 'var(--navy)',
          }}
        >
          {t('settings.title')}
        </h1>
      </div>

      <form onSubmit={(e) => void handleSave(e)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Basic settings */}
        <div className="card">
          <h2 style={cardHeadingStyle}>{t('settings.basic')}</h2>
          <div style={{ marginBottom: '20px' }}>
            <label className="field-label" htmlFor="lawyer-name">{t('settings.name')}</label>
            <input
              id="lawyer-name"
              type="text"
              value={settings.name ?? ''}
              onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))}
              className="field-input"
              placeholder={t('settings.namePlaceholder')}
              required
            />
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
              {t('settings.nameHelper')}
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
            }}
          >
            <div>
              <label className="field-label" htmlFor="slot-length">{t('settings.slotLength')}</label>
              <select
                id="slot-length"
                value={settings.slotLength}
                onChange={(e) => setSettings((s) => ({ ...s, slotLength: Number(e.target.value) }))}
                className="field-input"
              >
                {[30, 45, 60, 90, 120].map((v) => (
                  <option key={v} value={v}>{v}{t('settings.minuteSuffix')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label" htmlFor="buffer">{t('settings.buffer')}</label>
              <select
                id="buffer"
                value={settings.bufferMinutes}
                onChange={(e) => setSettings((s) => ({ ...s, bufferMinutes: Number(e.target.value) }))}
                className="field-input"
              >
                {[0, 10, 15, 30].map((v) => (
                  <option key={v} value={v}>{v}{t('settings.minuteSuffix')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label" htmlFor="timezone">{t('settings.timezone')}</label>
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
          <h2 style={cardHeadingStyle}>{t('settings.workingHours')}</h2>
          <WorkingHoursEditor
            value={settings.workingHours ?? (DEFAULT_WORKING_HOURS as LawyerSettingsInput['workingHours'])}
            onChange={(wh) => setSettings((s) => ({ ...s, workingHours: wh }))}
          />
        </div>

        {/* Widget Design */}
        <div className="card">
          <h2 style={cardHeadingStyle}>{t('settings.widgetDesign')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Primary color */}
            <div>
              <label className="field-label">{t('settings.primaryColor')}</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={settings.embedConfig?.primaryColor ?? '#1A3050'}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, embedConfig: { ...s.embedConfig, primaryColor: e.target.value } }))
                  }
                  style={{ width: '48px', height: '36px', padding: '2px', border: '1px solid var(--rule)', borderRadius: '6px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={settings.embedConfig?.primaryColor ?? '#1A3050'}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, embedConfig: { ...s.embedConfig, primaryColor: e.target.value } }))
                  }
                  placeholder="#1A3050"
                  className="field-input"
                  style={{ width: '120px' }}
                />
              </div>
            </div>

            {/* Logo upload */}
            <div>
              <label className="field-label">{t('settings.logo')}</label>
              {settings.embedConfig?.logoUrl && (
                <div style={{ marginBottom: '10px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.embedConfig.logoUrl}
                    alt={t('settings.logoPreviewAlt')}
                    style={{ maxHeight: '60px', maxWidth: '200px', objectFit: 'contain', border: '1px solid var(--rule)', borderRadius: '6px', padding: '4px' }}
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => void handleLogoUpload(e)}
                disabled={logoUploading}
                className="field-input"
                style={{ cursor: 'pointer' }}
              />
              {logoUploading && <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>{t('settings.uploading')}</p>}
              {logoError && <p style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>{logoError}</p>}
            </div>

            {/* Intro text */}
            <div>
              <label className="field-label" htmlFor="intro-text">{t('settings.introText')}</label>
              <textarea
                id="intro-text"
                value={settings.embedConfig?.introText ?? ''}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, embedConfig: { ...s.embedConfig, introText: e.target.value } }))
                }
                rows={2}
                className="field-input"
                style={{ resize: 'vertical' }}
                placeholder={t('settings.introTextPlaceholder')}
              />
            </div>

            {/* Custom message */}
            <div>
              <label className="field-label" htmlFor="custom-message">{t('settings.customMessage')}</label>
              <textarea
                id="custom-message"
                value={settings.embedConfig?.customMessage ?? ''}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, embedConfig: { ...s.embedConfig, customMessage: e.target.value } }))
                }
                rows={3}
                className="field-input"
                style={{ resize: 'vertical' }}
                placeholder={t('settings.customMessagePlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Intake questions */}
        <div className="card">
          <h2 style={cardHeadingStyle}>{t('settings.intakeQuestions')}</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
            {t('settings.intakeQuestionsHelper')}
          </p>
          <IntakeQuestionsEditor
            value={(settings.intakeQuestions as IntakeQuestion[]) ?? []}
            onChange={(qs) => setSettings((s) => ({ ...s, intakeQuestions: qs }))}
          />
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
            {t('settings.googleCalendar')}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
            {t('settings.googleCalendarHelper')}
          </p>
          <a href="/settings/google-calendar" className="btn btn-secondary">
            {t('settings.googleCalendarManage')}
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
            {t('settings.saved')}
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
            {loading ? t('settings.saving') : t('settings.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
