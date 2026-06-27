'use client';

import { useLocale } from '@/lib/i18n/LocaleProvider';
import AppointmentList from '@/components/dashboard/AppointmentList';
import type { ClientAppointment } from '@/types';

interface AppointmentsViewProps {
  pendingAppointments: ClientAppointment[];
  confirmedAppointments: ClientAppointment[];
  lawyerTimezone: string;
}

export function AppointmentsView({ pendingAppointments, confirmedAppointments, lawyerTimezone }: AppointmentsViewProps) {
  const { t, locale } = useLocale();
  const unitSuffix = t('appointments.unitSuffix');
  const formatCount = (n: number) => (locale === 'ko' ? `${n}${unitSuffix}` : `${n}`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      {/* Page header */}
      <div>
        <p className="section-eyebrow">{t('appointments.eyebrow')}</p>
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif), Georgia, serif',
            fontSize: '32px',
            color: 'var(--navy)',
          }}
        >
          {t('appointments.title')}
        </h1>
      </div>

      {/* Pending */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              fontSize: '22px',
              color: 'var(--navy)',
            }}
          >
            {t('appointments.pending')}
          </h2>
          <span className="badge badge-pending">
            {formatCount(pendingAppointments.length)}
          </span>
        </div>
        <AppointmentList
          appointments={pendingAppointments}
          lawyerTimezone={lawyerTimezone}
        />
      </section>

      {/* Confirmed */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              fontSize: '22px',
              color: 'var(--navy)',
            }}
          >
            {t('appointments.confirmed')}
          </h2>
          <span className="badge badge-confirmed">
            {formatCount(confirmedAppointments.length)}
          </span>
        </div>
        <AppointmentList
          appointments={confirmedAppointments}
          lawyerTimezone={lawyerTimezone}
        />
      </section>
    </div>
  );
}
