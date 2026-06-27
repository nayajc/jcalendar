import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { appointmentConverter, lawyerConverter } from '@/lib/firebase/converters';
import { AppointmentsView } from '@/components/dashboard/AppointmentsView';
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
    <AppointmentsView
      pendingAppointments={pendingAppointments}
      confirmedAppointments={confirmedAppointments}
      lawyerTimezone={lawyerTimezone}
    />
  );
}
