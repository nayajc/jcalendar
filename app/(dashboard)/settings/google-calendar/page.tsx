import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { generateAuthUrl } from '@/lib/google-calendar/client';
import { redirect } from 'next/navigation';
import { GoogleCalendarView } from '@/components/dashboard/GoogleCalendarView';
import type { Lawyer } from '@/types';

export default async function GoogleCalendarSettingsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    redirect('/login');
  }

  let lawyerId: string;
  try {
    const claims = await adminAuth.verifySessionCookie(sessionCookie, true);
    lawyerId = claims.uid;
  } catch {
    redirect('/login');
  }

  const lawyerDoc = await adminDb.collection('lawyers').doc(lawyerId).get();
  const lawyer = lawyerDoc.exists ? ({ id: lawyerId, ...lawyerDoc.data() } as Lawyer) : null;
  const isConnected = Boolean(lawyer?.googleCalendar?.calendarId);

  const authUrl = generateAuthUrl(lawyerId);

  return (
    <GoogleCalendarView
      isConnected={isConnected}
      calendarId={lawyer?.googleCalendar?.calendarId}
      authUrl={authUrl}
    />
  );
}
