import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { lawyerConverter } from '@/lib/firebase/converters';
import { redirect } from 'next/navigation';
import { EmbedView } from '@/components/dashboard/EmbedView';

async function getLawyerId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decoded.uid;
  } catch {
    return null;
  }
}

export default async function EmbedPage() {
  const lawyerId = await getLawyerId();
  if (!lawyerId) {
    redirect('/login');
  }

  const lawyerSnap = await adminDb
    .collection('lawyers')
    .withConverter(lawyerConverter)
    .doc(lawyerId)
    .get();

  const lawyer = lawyerSnap.data();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://your-domain.com';
  const widgetUrl = `${baseUrl}/widget/${lawyerId}`;

  const iframeCode = `<iframe
  src="${widgetUrl}"
  width="100%"
  height="700"
  frameborder="0"
  style="border-radius: 8px; border: 1px solid #C8D3E3;"
  title="${lawyer?.name ?? '상담사'} 상담 예약"
></iframe>`;

  return <EmbedView widgetUrl={widgetUrl} iframeCode={iframeCode} />;
}
