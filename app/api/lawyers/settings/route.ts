import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { lawyerSettingsSchema } from '@/lib/validators';
import { cookies } from 'next/headers';
import { Timestamp } from 'firebase-admin/firestore';

export async function PUT(req: Request) {
  // 인증 확인
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  let lawyerId: string;
  try {
    const claims = await adminAuth.verifySessionCookie(sessionCookie, true);
    lawyerId = claims.uid;
  } catch {
    return NextResponse.json({ error: '세션이 만료되었습니다' }, { status: 401 });
  }

  // 입력 검증
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 JSON 형식입니다' }, { status: 400 });
  }

  const parseResult = lawyerSettingsSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: '입력 검증 실패', details: parseResult.error.flatten() },
      { status: 422 }
    );
  }

  const { name, timezone, slotLength, bufferMinutes, workingHours, embedConfig, intakeQuestions } =
    parseResult.data;

  // Firestore 저장
  await adminDb
    .collection('lawyers')
    .doc(lawyerId)
    .set(
      {
        id: lawyerId,
        name,
        timezone,
        slotLength,
        bufferMinutes,
        workingHours,
        embedConfig,
        ...(intakeQuestions !== undefined ? { intakeQuestions } : {}),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

  return NextResponse.json({ status: 'ok' });
}

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  let lawyerId: string;
  try {
    const claims = await adminAuth.verifySessionCookie(sessionCookie, true);
    lawyerId = claims.uid;
  } catch {
    return NextResponse.json({ error: '세션이 만료되었습니다' }, { status: 401 });
  }

  const doc = await adminDb.collection('lawyers').doc(lawyerId).get();
  if (!doc.exists) {
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({ data: { id: doc.id, ...doc.data() } });
}
