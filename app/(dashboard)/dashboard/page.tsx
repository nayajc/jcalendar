import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { redirect } from 'next/navigation';
import { DashboardView } from '@/components/dashboard/DashboardView';

export default async function DashboardPage() {
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

  const appointmentsSnap = await adminDb
    .collection('appointments')
    .where('lawyerId', '==', lawyerId)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  const appointments = appointmentsSnap.docs.map((doc) => {
    const data = doc.data() as { status?: string; client?: { name?: string } };
    return {
      id: doc.id,
      status: data.status,
      client: data.client ? { name: data.client.name } : undefined,
    };
  });

  const pending = appointments.filter((a) => a.status === 'pending').length;
  const confirmed = appointments.filter((a) => a.status === 'confirmed').length;

  return <DashboardView appointments={appointments} pending={pending} confirmed={confirmed} />;
}
