import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { UPLOAD_MAX_FILE_SIZE, UPLOAD_ALLOWED_MIME_TYPES } from '@/lib/validators';
import { uploadBuffer } from '@/lib/firebase/storage';
import { randomBytes } from 'crypto';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  // Rate limit by IP
  const headerStore = await headers();
  const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  const rl = await checkRateLimit(`upload:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
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
    return NextResponse.json({ error: `파일 크기는 ${UPLOAD_MAX_FILE_SIZE / 1024 / 1024}MB 이하여야 합니다` }, { status: 400 });
  }

  const allowedTypes: readonly string[] = UPLOAD_ALLOWED_MIME_TYPES;
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: '허용되지 않는 파일 형식입니다' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const randomId = randomBytes(16).toString('hex');
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `appointments/uploads/${randomId}/${safeName}`;

  const url = await uploadBuffer(path, buffer, file.type);

  return NextResponse.json({
    name: file.name,
    url,
    size: file.size,
    contentType: file.type,
  });
}
