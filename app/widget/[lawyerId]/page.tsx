import { adminDb } from '@/lib/firebase/admin';
import { lawyerConverter } from '@/lib/firebase/converters';
import { notFound } from 'next/navigation';
import { WidgetClient } from './WidgetClient';

interface PageProps {
  params: Promise<{ lawyerId: string }>;
}

export default async function WidgetPage({ params }: PageProps) {
  const { lawyerId } = await params;

  const lawyerSnap = await adminDb
    .collection('lawyers')
    .withConverter(lawyerConverter)
    .doc(lawyerId)
    .get();

  if (!lawyerSnap.exists) {
    notFound();
  }

  const lawyer = lawyerSnap.data()!;

  return (
    <WidgetClient
      lawyerId={lawyerId}
      lawyerName={lawyer.name}
      embedConfig={lawyer.embedConfig}
      intakeQuestions={lawyer.intakeQuestions ?? []}
    />
  );
}
