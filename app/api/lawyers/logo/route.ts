import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { UPLOAD_MAX_FILE_SIZE, UPLOAD_ALLOWED_MIME_TYPES } from '@/lib/validators';
import { uploadBuffer } from '@/lib/firebase/storage';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: Request) {
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

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 });
  }

  if (file.size > UPLOAD_MAX_FILE_SIZE) {
    return NextResponse.json({ error: '파일 크기 초과' }, { status: 400 });
  }

  const allowedTypes: readonly string[] = UPLOAD_ALLOWED_MIME_TYPES;
  if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
    return NextResponse.json({ error: '허용되지 않는 파일 형식입니다' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() ?? 'bin';
  const randomId = randomBytes(8).toString('hex');
  const path = `lawyers/${lawyerId}/logo-${randomId}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const url = await uploadBuffer(path, buffer, file.type);

  await adminDb.collection('lawyers').doc(lawyerId).set(
    { embedConfig: { logoUrl: url }, updatedAt: Timestamp.now() },
    { merge: true }
  );

  return NextResponse.json({ url });
}
