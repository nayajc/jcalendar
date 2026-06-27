'use client';

import { useState, useEffect, useRef } from 'react';
import type { AvailabilitySlot } from '@/types';
import type { CreateAppointmentInput } from '@/lib/validators';

interface BookingFormProps {
  lawyerId: string;
  slot: AvailabilitySlot;
  primaryColor?: string;
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

export function BookingForm({ lawyerId, slot, primaryColor = '#1A3050', onSuccess, onBack }: BookingFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [inquiry, setInquiry] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const captchaWidgetId = useRef<string>('');

  const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? '';

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

  const validate = (): string | null => {
    if (!name.trim()) return '이름을 입력해주세요.';
    if (!phone.trim()) return '전화번호를 입력해주세요.';
    if (!email.trim() || !email.includes('@')) return '유효한 이메일 주소를 입력해주세요.';
    if (inquiry.trim().length < 10) return '문의 내용은 최소 10자 이상 입력해주세요.';
    if (siteKey && !captchaToken) return 'hCaptcha를 완료해주세요.';
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

    const payload: CreateAppointmentInput = {
      lawyerId,
      slotStart: slot.start,
      slotEnd: slot.end,
      client: { name: name.trim(), phone: phone.trim(), email: email.trim() },
      clientTimezone,
      inquiry: inquiry.trim(),
      captchaToken: captchaToken || 'dev-bypass',
    };

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = (await res.json()) as { appointmentId?: string; error?: string };

      if (!res.ok) {
        throw new Error(body.error ?? '예약 생성에 실패했습니다.');
      }

      onSuccess(body.appointmentId ?? '');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '예약 중 오류가 발생했습니다.');
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
        ← 날짜 다시 선택
      </button>

      {/* Selected slot summary */}
      <div
        style={{
          background: '#EDF1F7',
          border: '1px solid #C8D3E3',
          borderLeft: '3px solid #1A3050',
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
          {clientTimezone} 기준
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <Field label="이름 *">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            style={fieldStyle}
            required
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </Field>

        <Field label="전화번호 *">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
            style={fieldStyle}
            required
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </Field>

        <Field label="이메일 *">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            style={fieldStyle}
            required
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
        </Field>

        <Field label={`문의 내용 * (최소 10자)`}>
          <textarea
            value={inquiry}
            onChange={(e) => setInquiry(e.target.value)}
            placeholder="상담받고 싶은 내용을 자세히 작성해주세요."
            rows={5}
            style={{ ...fieldStyle, resize: 'vertical' }}
            required
            minLength={10}
            maxLength={2000}
            onFocus={focusStyle}
            onBlur={blurStyle}
          />
          <span
            style={{
              display: 'block',
              textAlign: 'right',
              fontSize: '11px',
              color: inquiry.length >= 1800 ? '#DC2626' : '#94A3B8',
              marginTop: '4px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {inquiry.length}/2000
          </span>
        </Field>

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
          {submitState === 'submitting' ? '예약 접수 중...' : '예약 신청하기'}
        </button>
      </form>
    </div>
  );
}
