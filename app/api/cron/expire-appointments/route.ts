/**
 * GET /api/cron/expire-appointments
 *
 * 만료 처리 Cron API Route.
 * slots 컬렉션에서 status='held' AND holdExpiresAt <= now 인 슬롯을 조회하여
 * 각 건에 대해:
 *  1. appointment status → 'expired', updatedAt 갱신
 *  2. slot 문서 delete (슬롯 해제 → 재노출)
 *  3. 상담자에게 만료 이메일 발송
 *
 * 인증: Authorization: Bearer {CRON_SECRET} 헤더 검증
 *
 * MVP 기본 호출: cron-job.org에서 15분 간격으로 호출.
 * Vercel Pro 사용 시: vercel.json crons 설정으로 대체 가능.
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { appointmentConverter, slotConverter, lawyerConverter } from '@/lib/firebase/converters';
import { deleteCalendarEvent } from '@/lib/google-calendar/events';
import { sendExpiredEmail } from '@/lib/email/send';

export const runtime = 'nodejs';
// Vercel 함수 최대 실행 시간 (Pro 플랜 기준 300초)
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

  // 2. 만료된 슬롯 조회: status='held' AND holdExpiresAt <= now
  const now = Timestamp.now();
  const slotsQuery = adminDb
    .collection('slots')
    .withConverter(slotConverter)
    .where('status', '==', 'held')
    .where('holdExpiresAt', '<=', now);

  const slotsSnap = await slotsQuery.get();

  if (slotsSnap.empty) {
    return NextResponse.json({ processed: 0, message: '만료된 슬롯 없음' });
  }

  let processed = 0;
  let errors = 0;

  // 3. 각 만료 슬롯 처리
  const tasks = slotsSnap.docs.map(async (slotDoc) => {
    const slot = slotDoc.data();
    const appointmentRef = adminDb
      .collection('appointments')
      .withConverter(appointmentConverter)
      .doc(slot.appointmentId);

    try {
      // a. appointment 상태 → 'expired'
      await appointmentRef.update({
        status: 'expired',
        updatedAt: FieldValue.serverTimestamp(),
      });

      // b. slot 문서 삭제 (슬롯 해제)
      await slotDoc.ref.delete();

      // c. tentative Google 이벤트 삭제 + 만료 이메일 발송 (실패해도 앱 플로우 계속)
      try {
        const apptSnap = await appointmentRef.get();
        const appointment = apptSnap.data();
        if (appointment) {
          const lawyerSnap = await adminDb
            .collection('lawyers')
            .withConverter(lawyerConverter)
            .doc(appointment.lawyerId)
            .get();
          const lawyer = lawyerSnap.data();
          if (lawyer) {
            const googleEventId = (appointment as { googleEventId?: string }).googleEventId;
            if (googleEventId) {
              try {
                await deleteCalendarEvent(lawyer, googleEventId);
              } catch (calErr) {
                console.error(`[expire-cron] Google 이벤트 삭제 실패 (appointmentId=${slot.appointmentId}):`, calErr);
              }
            }
            await sendExpiredEmail(appointment, lawyer);
          }
        }
      } catch (emailErr) {
        console.error(`[expire-cron] 이메일 발송 실패 (appointmentId=${slot.appointmentId}):`, emailErr);
      }

      processed++;
    } catch (err) {
      console.error(`[expire-cron] 처리 실패 (slotId=${slotDoc.id}):`, err);
      errors++;
    }
  });

  await Promise.allSettled(tasks);

  return NextResponse.json({
    processed,
    errors,
    message: `${processed}건 처리 완료${errors > 0 ? `, ${errors}건 오류` : ''}`,
  });
}
