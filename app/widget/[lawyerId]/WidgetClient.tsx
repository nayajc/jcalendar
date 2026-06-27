'use client';

import { useState } from 'react';
import { SlotPicker } from '@/components/widget/SlotPicker';
import { BookingForm } from '@/components/widget/BookingForm';
import { ConfirmationView } from '@/components/widget/ConfirmationView';
import type { AvailabilitySlot, EmbedConfig, IntakeQuestion } from '@/types';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { LocaleToggle } from '@/components/LocaleToggle';

type Step = 'pick' | 'form' | 'done';

interface WidgetClientProps {
  lawyerId: string;
  lawyerName: string;
  embedConfig: EmbedConfig;
  intakeQuestions: IntakeQuestion[];
}

export function WidgetClient({
  lawyerId,
  lawyerName,
  embedConfig,
  intakeQuestions,
}: WidgetClientProps) {
  const { t } = useLocale();
  const STEPS = [
    { key: 'pick', label: t('widget.stepPick') },
    { key: 'form', label: t('widget.stepForm') },
    { key: 'done', label: t('widget.stepDone') },
  ];
  const [step, setStep] = useState<Step>('pick');
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [appointmentId, setAppointmentId] = useState('');

  const primaryColor = embedConfig.primaryColor ?? '#1A3050';
  const customMessage = embedConfig.customMessage;
  const introText = embedConfig.introText;
  const logoUrl = embedConfig.logoUrl;

  const handleSlotSelected = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
    setStep('form');
  };

  const handleSuccess = (id: string) => {
    setAppointmentId(id);
    setStep('done');
  };

  const stepIdx = step === 'pick' ? 0 : step === 'form' ? 1 : 2;

  return (
    <div
      style={{
        maxWidth: '520px',
        margin: '0 auto',
        padding: '28px 20px 40px',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      {/* Language toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <LocaleToggle />
      </div>

      {/* Header */}
      <div
        style={{
          marginBottom: '28px',
          paddingBottom: '20px',
          borderBottom: `2px solid ${primaryColor}`,
        }}
      >
        {/* Logo */}
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={t('widget.logoAlt')}
            style={{ maxHeight: '48px', maxWidth: '160px', objectFit: 'contain', marginBottom: '12px', display: 'block' }}
          />
        )}

        {/* Brand mark (show if no logo) */}
        {!logoUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect width="24" height="24" rx="4" fill={primaryColor} />
              <path
                d="M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"
                stroke="#C6912A"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#64748B',
              }}
            >
              {t('widget.brandFallback')}
            </span>
          </div>
        )}

        {introText && (
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '8px', lineHeight: 1.6 }}>
            {introText}
          </p>
        )}

        <h1
          style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: 700,
            color: primaryColor,
            lineHeight: 1.2,
          }}
        >
          {lawyerName}
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#64748B', lineHeight: 1.5 }}>
          {customMessage ?? t('widget.defaultMessage')}
        </p>
      </div>

      {/* Step indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '28px',
          gap: '0',
        }}
      >
        {STEPS.map((s, idx) => {
          const active = idx === stepIdx;
          const done = idx < stepIdx;
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: idx < 2 ? 1 : 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: done ? '#0F6E3E' : active ? primaryColor : '#E8EDF4',
                    color: done || active ? '#fff' : '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    flexShrink: 0,
                    transition: 'background 0.2s',
                  }}
                >
                  {done ? '✓' : idx + 1}
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: active ? 700 : 400,
                    color: active ? primaryColor : done ? '#0F6E3E' : '#94A3B8',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.label}
                </span>
              </div>
              {idx < 2 && (
                <div
                  style={{
                    flex: 1,
                    height: '1px',
                    background: done ? '#0F6E3E' : '#CBD5E1',
                    margin: '0 8px',
                    transition: 'background 0.2s',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      {step === 'pick' && (
        <SlotPicker
          lawyerId={lawyerId}
          primaryColor={primaryColor}
          onSlotSelected={handleSlotSelected}
        />
      )}

      {step === 'form' && selectedSlot && (
        <BookingForm
          lawyerId={lawyerId}
          slot={selectedSlot}
          primaryColor={primaryColor}
          intakeQuestions={intakeQuestions}
          onSuccess={handleSuccess}
          onBack={() => setStep('pick')}
        />
      )}

      {step === 'done' && (
        <ConfirmationView appointmentId={appointmentId} primaryColor={primaryColor} />
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: '36px',
          paddingTop: '16px',
          borderTop: '1px solid #E8EDF4',
          fontSize: '11px',
          color: '#94A3B8',
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        {t('widget.footerTimezone')}({Intl.DateTimeFormat().resolvedOptions().timeZone}) {t('widget.footerTimezoneSuffix')}
      </div>
    </div>
  );
}
