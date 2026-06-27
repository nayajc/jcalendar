import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { appointmentConverter, lawyerConverter } from '@/lib/firebase/converters';
import AppointmentList from '@/components/dashboard/AppointmentList';
import type { Appointment } from '@/types';

async function getAuthenticatedLawyerId(): Promise<string> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect('/login');

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decoded.uid;
  } catch {
    redirect('/login');
  }
}

export default async function AppointmentsPage() {
  const lawyerId = await getAuthenticatedLawyerId();

  const lawyerSnap = await adminDb
    .collection('lawyers')
    .doc(lawyerId)
    .withConverter(lawyerConverter)
    .get();

  const lawyer = lawyerSnap.data();
  const lawyerTimezone = lawyer?.timezone ?? 'Asia/Seoul';

  const [pendingSnap, confirmedSnap] = await Promise.all([
    adminDb
      .collection('appointments')
      .withConverter(appointmentConverter)
      .where('lawyerId', '==', lawyerId)
      .where('status', '==', 'pending')
      .orderBy('slotStart', 'asc')
      .get(),
    adminDb
      .collection('appointments')
      .withConverter(appointmentConverter)
      .where('lawyerId', '==', lawyerId)
      .where('status', '==', 'confirmed')
      .orderBy('slotStart', 'asc')
      .get(),
  ]);

  const pendingAppointments: Appointment[] = pendingSnap.docs.map((d) => d.data());
  const confirmedAppointments: Appointment[] = confirmedSnap.docs.map((d) => d.data());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      {/* Page header */}
      <div>
        <p className="section-eyebrow">관리</p>
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif), Georgia, serif',
            fontSize: '32px',
            color: 'var(--navy)',
          }}
        >
          예약 관리
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
            대기중 예약
          </h2>
          <span className="badge badge-pending">
            {pendingAppointments.length}건
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
            확정 예약
          </h2>
          <span className="badge badge-confirmed">
            {confirmedAppointments.length}건
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
