import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import { appointmentConverter, lawyerConverter } from '@/lib/firebase/converters';
import AppointmentClient from './AppointmentClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function AppointmentPage({ params }: PageProps) {
  const { token } = await params;

  const snap = await adminDb
    .collection('appointments')
    .withConverter(appointmentConverter)
    .where('cancelToken', '==', token)
    .limit(1)
    .get();

  if (snap.empty) {
    notFound();
  }

  const appt = snap.docs[0]!.data();

  const lawyerSnap = await adminDb
    .collection('lawyers')
    .withConverter(lawyerConverter)
    .doc(appt.lawyerId)
    .get();
  const lawyer = lawyerSnap.data();

  const tz = appt.clientTimezone;

  const initialData = {
    id: appt.id,
    status: appt.status,
    lawyerName: lawyer?.name ?? '',
    slotStartIso: appt.slotStart.toDate().toISOString(),
    slotEndIso: appt.slotEnd.toDate().toISOString(),
    clientTimezone: tz,
    inquiry: appt.inquiry,
    clientName: appt.client.name,
    cancelledBy: appt.cancelledBy,
  };

  return <AppointmentClient token={token} initialData={initialData} />;
}
