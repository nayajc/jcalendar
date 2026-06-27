/**
 * GET /api/cron/reminders
 *
 * 리마인더 이메일 Cron API Route.
 * confirmed 상태 예약 중:
 *  - slotStart가 지금~24시간 이내 + reminded24h 미발송 → 24h 리마인더 발송
 *  - slotStart가 지금~1시간 이내 + reminded1h 미발송 → 1h 리마인더 발송
 *
 * 인증: Authorization: Bearer {CRON_SECRET} 헤더 검증
 *
 * 권장 호출 주기: 15분 간격 (cron-job.org 또는 vercel.json crons)
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { appointmentConverter, lawyerConverter } from '@/lib/firebase/converters';
import { sendReminderEmail } from '@/lib/email/send';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(req: NextRequest): Promise<NextResponse> {
  // 1. CRON_SECRET 인증
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Timestamp.now();
  const nowMs = now.toMillis();
  const in24h = Timestamp.fromMillis(nowMs + 24 * 60 * 60 * 1000);
  const in1h = Timestamp.fromMillis(nowMs + 60 * 60 * 1000);

  // 2. confirmed + slotStart <= 24시간 이내 쿼리
  // (slotStart > now AND slotStart <= now+24h)
  // Firestore 복합 쿼리: status==confirmed + slotStart 범위 (인덱스 배포됨)
  const snap = await adminDb
    .collection('appointments')
    .withConverter(appointmentConverter)
    .where('status', '==', 'confirmed')
    .where('slotStart', '>', now)
    .where('slotStart', '<=', in24h)
    .get();

  if (snap.empty) {
    return NextResponse.json({ sent24h: 0, sent1h: 0, errors: 0, message: '처리할 예약 없음' });
  }

  let sent24h = 0;
  let sent1h = 0;
  let errors = 0;

  const tasks = snap.docs.map(async (doc) => {
    const appt = doc.data();
    const slotMs = appt.slotStart.toMillis();
    const is1h = slotMs <= in1h.toMillis();

    try {
      const lawyerSnap = await adminDb
        .collection('lawyers')
        .withConverter(lawyerConverter)
        .doc(appt.lawyerId)
        .get();
      const lawyer = lawyerSnap.data();
      if (!lawyer) return;

      // 1h 리마인더 (1h 이내 + 미발송)
      if (is1h && !appt.reminded1h) {
        await sendReminderEmail(appt, lawyer, '1h');
        await doc.ref.update({
          reminded1h: true,
          updatedAt: FieldValue.serverTimestamp(),
        });
        sent1h++;
        return;
      }

      // 24h 리마인더 (24h 이내 + 미발송, 1h 미만 제외는 하지 않음 — 1h도 24h 범위 포함)
      // 단, reminded24h 미발송인 경우만
      if (!appt.reminded24h) {
        await sendReminderEmail(appt, lawyer, '24h');
        await doc.ref.update({
          reminded24h: true,
          updatedAt: FieldValue.serverTimestamp(),
        });
        sent24h++;
      }
    } catch (err) {
      console.error(`[reminders-cron] 처리 실패 (appointmentId=${appt.id}):`, err);
      errors++;
    }
  });

  await Promise.allSettled(tasks);

  return NextResponse.json({
    sent24h,
    sent1h,
    errors,
    message: `24h: ${sent24h}건, 1h: ${sent1h}건 발송${errors > 0 ? `, ${errors}건 오류` : ''}`,
  });
}
