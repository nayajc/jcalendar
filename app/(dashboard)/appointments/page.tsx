import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { appointmentConverter, lawyerConverter } from '@/lib/firebase/converters';
import { AppointmentsView } from '@/components/dashboard/AppointmentsView';
import type { Appointment, ClientAppointment } from '@/types';

function toClientAppointment(a: Appointment): ClientAppointment {
  return {
    id: a.id,
    status: a.status,
    client: a.client,
    inquiry: a.inquiry,
    intakeAnswers: a.intakeAnswers,
    attachments: a.attachments,
    slotStart: a.slotStart.toDate().toISOString(),
    slotEnd: a.slotEnd.toDate().toISOString(),
  };
}

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

  const pendingAppointments: ClientAppointment[] = pendingSnap.docs.map((d) => toClientAppointment(d.data()));
  const confirmedAppointments: ClientAppointment[] = confirmedSnap.docs.map((d) => toClientAppointment(d.data()));

  return (
    <AppointmentsView
      pendingAppointments={pendingAppointments}
      confirmedAppointments={confirmedAppointments}
      lawyerTimezone={lawyerTimezone}
    />
  );
}
