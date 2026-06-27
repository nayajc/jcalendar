'use client';

import { useState, useEffect, useRef } from 'react';
import type { AvailabilitySlot, IntakeQuestion } from '@/types';
import type { CreateAppointmentInput } from '@/lib/validators';
import { UPLOAD_MAX_FILE_SIZE, UPLOAD_MAX_FILES, UPLOAD_ALLOWED_MIME_TYPES } from '@/lib/validators';
import { useLocale } from '@/lib/i18n/LocaleProvider';

interface BookingFormProps {
  lawyerId: string;
  slot: AvailabilitySlot;
  primaryColor?: string;
  intakeQuestions?: IntakeQuestion[];
  onSuccess: (appointmentId: string) => void;
  onBack: () => void;
}

type SubmitState = 'idle' | 'submitting' | 'error';

function formatSlotDisplay(start: string, end: string): string {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(iso));
  return `${fmt(start)} ~ ${new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(end))}`;
}

declare global {
  interface Window {
    hcaptcha?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void }) => string;
      reset: (id: string) => void;
    };
  }
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #C8D3E3',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit',
  color: '#0F1923',
  background: '#fff',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase' as const,
  color: '#64748B',
  marginBottom: '6px',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export function BookingForm({ lawyerId, slot, primaryColor = '#1A3050', intakeQuestions = [], onSuccess, onBack }: BookingFormProps) {
  const { t } = useLocale();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [inquiry, setInquiry] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const captchaWidgetId = useRef<string>('');

  const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? '';

  const allowedTypes: readonly string[] = UPLOAD_ALLOWED_MIME_TYPES;

  useEffect(() => {
    if (!siteKey || !captchaContainerRef.current) return;

    const scriptId = 'hcaptcha-script';
    const existing = document.getElementById(scriptId);

    const renderWidget = () => {
      if (window.hcaptcha && captchaContainerRef.current) {
        captchaWidgetId.current = window.hcaptcha.render(captchaContainerRef.current, {
          sitekey: siteKey,
          callback: (token) => setCaptchaToken(token),
          'expired-callback': () => setCaptchaToken(''),
        });
      }
    };

    if (existing) {
      renderWidget();
    } else {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    }
  }, [siteKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > UPLOAD_MAX_FILES) {
      setFileError(`${t('booking.maxFilesError')} ${UPLOAD_MAX_FILES}${t('booking.maxFilesErrorSuffix')}`);
      return;
    }
    for (const f of selected) {
      if (f.size > UPLOAD_MAX_FILE_SIZE) {
        setFileError(`${t('booking.maxSizeError')} ${UPLOAD_MAX_FILE_SIZE / 1024 / 1024}${t('booking.maxSizeErrorSuffix')} (${f.name})`);
        return;
      }
      if (!allowedTypes.includes(f.type)) {
        setFileError(`${t('booking.invalidTypeError')} (${f.name})`);
        return;
      }
    }
    setFiles(selected);
  };

  const validate = (): string | null => {
    if (!name.trim()) return t('booking.validateName');
    if (!phone.trim()) return t('booking.validatePhone');
    if (!email.trim() || !email.includes('@')) return t('booking.validateEmail');
    if (inquiry.trim().length < 10) return t('booking.validateInquiry');
    if (siteKey && !captchaToken) return t('booking.validateCaptcha');
    for (const q of intakeQuestions) {
      if (q.required && !intakeAnswers[q.id]?.trim()) {
        return `"${q.label}" ${t('booking.validateIntakeRequired')}`;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setSubmitState('submitting');
    setErrorMsg('');

    // Upload files first
    let uploadedAttachments: { name: string; url: string; size: number; contentType: string }[] = [];
    if (files.length > 0) {
      try {
        uploadedAttachments = await Promise.all(
          files.map(async (file) => {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            if (!res.ok) {
              const body = await res.json() as { error?: string };
              throw new Error(body.error ?? t('booking.uploadFailed'));
            }
            return res.json() as Promise<{ name: string; url: string; size: number; contentType: string }>;
          })
        );
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : t('booking.uploadError'));
        setSubmitState('error');
        return;
      }
    }

    const answersArray = intakeQuestions.map((q) => ({
      questionId: q.id,
      label: q.label,
      answer: intakeAnswers[q.id] ?? '',
    }));

    const payload: CreateAppointmentInput = {
      lawyerId,
      slotStart: slot.start,
      slotEnd: slot.end,
      client: { name: name.trim(), phone: phone.trim(), email: email.trim() },
      clientTimezone,
      inquiry: inquiry.trim(),
      captchaToken: captchaToken || 'dev-bypass',
      ...(answersArray.length > 0 ? { intakeAnswers: answersArray } : {}),
      ...(uploadedAttachments.length > 0 ? { attachments: uploadedAttachments } : {}),
    };

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = (await res.json()) as { appointmentId?: string; error?: string };

      if (!res.ok) {
        throw new Error(body.error ?? t('booking.createFailed'));
      }

      onSuccess(body.appointmentId ?? '');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('booking.bookingError'));
      setSubmitState('error');

      if (window.hcaptcha && captchaWidgetId.current) {
        window.hcaptcha.reset(captchaWidgetId.current);
        setCaptchaToken('');
      }
    }
  };

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#3D5A80';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(61,90,128,0.12)';
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#C8D3E3';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div>
      {/* Back link */}
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#3D5A80',
          cursor: 'pointer',
          padding: '0 0 20px',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'inherit',
        }}
      >
        {t('booking.back')}
      </button>

      {/* Selected slot summary */}
      <div
        style={{
          background: '#EDF1F7',
          border: '1px solid #C8D3E3',
          borderLeft: `3px solid ${primaryColor}`,
          borderRadius: '8px',
          padding: '14px 16px',
          marginBottom: '24px',
          fontSize: '14px',
          color: '#1A3050',
          fontWeight: 600,
          lineHeight: 1.5,
        }}
      >
        {formatSlotDisplay(slot.start, slot.end)}
        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 400, marginTop: '2px' }}>
          {clientTimezone} {t('booking.timezoneSuffix')}
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <Field label={t('booking.name')}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('booking.namePlaceholder')} style={fieldStyle} required onFocus={focusStyle} onBlur={blurStyle} />
        </Field>

        <Field label={t('booking.phone')}>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('booking.phonePlaceholder')} style={fieldStyle} required onFocus={focusStyle} onBlur={blurStyle} />
        </Field>

        <Field label={t('booking.email')}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('booking.emailPlaceholder')} style={fieldStyle} required onFocus={focusStyle} onBlur={blurStyle} />
        </Field>

        <Field label={t('booking.inquiry')}>
          <textarea
            value={inquiry}
            onChange={(e) => setInquiry(e.target.value)}
            placeholder={t('booking.inquiryPlaceholder')}
            rows={5}
            style={{ ...fieldStyle, resize: 'vertical' }}
            required
            minLength={10}
            maxLength={2000}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
          <span style={{ display: 'block', textAlign: 'right', fontSize: '11px', color: inquiry.length >= 1800 ? '#DC2626' : '#94A3B8', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
            {inquiry.length}/2000
          </span>
        </Field>

        {/* Intake questions */}
        {intakeQuestions.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: '#64748B',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid #E8EDF4',
              }}
            >
              {t('booking.intakeQuestions')}
            </div>
            {intakeQuestions.map((q) => (
              <Field key={q.id} label={`${q.label}${q.required ? ' *' : ''}`}>
                <textarea
                  value={intakeAnswers[q.id] ?? ''}
                  onChange={(e) => setIntakeAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  rows={3}
                  style={{ ...fieldStyle, resize: 'vertical' }}
                  required={q.required}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </Field>
            ))}
          </div>
        )}

        {/* File attachments */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>{t('booking.attachmentsLabel')} {UPLOAD_MAX_FILES}{t('booking.attachmentsLabelSuffix')}</label>
          <input
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            onChange={handleFileChange}
            style={{ ...fieldStyle, padding: '8px 14px', cursor: 'pointer' }}
          />
          {fileError && (
            <p style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>{fileError}</p>
          )}
          {files.length > 0 && (
            <ul style={{ fontSize: '12px', color: '#64748B', marginTop: '6px', paddingLeft: '16px' }}>
              {files.map((f, i) => (
                <li key={i}>{f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
              ))}
            </ul>
          )}
          <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
            {t('booking.allowedFormats')} {UPLOAD_MAX_FILE_SIZE / 1024 / 1024}MB
          </p>
        </div>

        {/* hCaptcha */}
        {siteKey && (
          <div style={{ marginBottom: '20px' }}>
            <div ref={captchaContainerRef} />
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#991B1B',
              fontSize: '14px',
              marginBottom: '16px',
              lineHeight: 1.5,
            }}
            role="alert"
          >
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={submitState === 'submitting'}
          style={{
            width: '100%',
            padding: '14px',
            background: submitState === 'submitting' ? '#64748B' : primaryColor,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: submitState === 'submitting' ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
            fontFamily: 'inherit',
            letterSpacing: '0.01em',
          }}
        >
          {submitState === 'submitting' ? t('booking.submitting') : t('booking.submit')}
        </button>
      </form>
    </div>
  );
}
