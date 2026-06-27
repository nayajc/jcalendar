/**
 * GET  /api/appointment/[token]  — cancelToken으로 예약 조회 (공개, 인증 불필요)
 * POST /api/appointment/[token]  — 상담자 셀프 취소 (공개, 인증 불필요)
 *
 * 민감정보를 최소화하여 반환합니다 (변호사명, 일시, 상태, 문의내용).
 * POST: pending/confirmed 상태인 경우만 취소 처리. 그 외 409 반환.
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import {
  appointmentConverter,
  lawyerConverter,
  slotConverter,
} from '@/lib/firebase/converters';
import { deleteCalendarEvent } from '@/lib/google-calendar/events';
import { sendCancelledEmail } from '@/lib/email/send';
import { checkRateLimit } from '@/lib/rate-limit';
import { formatInTimezone } from '@/lib/timezone';

export const runtime = 'nodejs';

const DATE_FORMAT = "yyyy년 MM월 dd일 HH:mm (zzz)";

interface RouteParams {
  params: Promise<{ token: string }>;
}

async function findAppointmentByToken(token: string) {
  const snap = await adminDb
    .collection('appointments')
    .withConverter(appointmentConverter)
    .where('cancelToken', '==', token)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snap.docs[0]!;
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0';
  const rateCheck = await checkRateLimit(ip);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 429 },
    );
  }

  const { token } = await params;
  const apptDoc = await findAppointmentByToken(token);

  if (!apptDoc) {
    return NextResponse.json({ error: '예약을 찾을 수 없습니다.' }, { status: 404 });
  }

  const appt = apptDoc.data();

  const lawyerSnap = await adminDb
    .collection('lawyers')
    .withConverter(lawyerConverter)
    .doc(appt.lawyerId)
    .get();
  const lawyer = lawyerSnap.data();

  const tz = appt.clientTimezone;
  const slotStart = appt.slotStart.toDate();
  const slotEnd = appt.slotEnd.toDate();
  const slotStartFormatted = formatInTimezone(slotStart, tz, DATE_FORMAT);
  const slotEndFormatted = formatInTimezone(slotEnd, tz, DATE_FORMAT);

  return NextResponse.json({
    id: appt.id,
    status: appt.status,
    lawyerName: lawyer?.name ?? '',
    slotStartFormatted,
    slotEndFormatted,
    clientTimezone: tz,
    inquiry: appt.inquiry,
    clientName: appt.client.name,
    cancelledBy: appt.cancelledBy,
  });
}

export async function POST(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0';
  const rateCheck = await checkRateLimit(ip);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 429 },
    );
  }

  const { token } = await params;
  const apptDoc = await findAppointmentByToken(token);

  if (!apptDoc) {
    return NextResponse.json({ error: '예약을 찾을 수 없습니다.' }, { status: 404 });
  }

  const appt = apptDoc.data();

  if (appt.status !== 'pending' && appt.status !== 'confirmed') {
    return NextResponse.json(
      { error: '이미 취소되었거나 처리가 완료된 예약입니다.' },
      { status: 409 },
    );
  }

  const apptRef = adminDb
    .collection('appointments')
    .withConverter(appointmentConverter)
    .doc(appt.id);

  const slotId = appt.slotId;
  const slotRef = adminDb.collection('slots').doc(slotId);
  const googleEventId = appt.googleEventId;

  // runTransaction: 취소 상태 업데이트 + 슬롯 락 삭제
  await adminDb.runTransaction(async (tx) => {
    const freshSnap = await tx.get(apptRef);
    const fresh = freshSnap.data();
    if (!fresh || (fresh.status !== 'pending' && fresh.status !== 'confirmed')) {
      throw new Error('ALREADY_PROCESSED');
    }

    tx.update(apptRef, {
      status: 'cancelled',
      cancelledBy: 'client',
      cancelledAt: Timestamp.now(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.delete(slotRef);
  }).catch((err: unknown) => {
    if (err instanceof Error && err.message === 'ALREADY_PROCESSED') {
      return null;
    }
    throw err;
  });

  // Google 이벤트 삭제 (실패해도 앱 플로우 계속)
  if (googleEventId) {
    try {
      const lawyerSnap = await adminDb
        .collection('lawyers')
        .withConverter(lawyerConverter)
        .doc(appt.lawyerId)
        .get();
      const lawyer = lawyerSnap.data();
      if (lawyer) {
        await deleteCalendarEvent(lawyer, googleEventId);
      }
    } catch (err) {
      console.error('[cancel-token] Google 이벤트 삭제 실패:', err);
    }
  }

  // 취소 이메일 발송 (변호사 + 상담자 양쪽)
  try {
    const cancelledApptSnap = await apptRef.get();
    const cancelledAppt = cancelledApptSnap.data();

    const lawyerSnap = await adminDb
      .collection('lawyers')
      .withConverter(lawyerConverter)
      .doc(appt.lawyerId)
      .get();
    const lawyer = lawyerSnap.data();

    if (cancelledAppt && lawyer) {
      // sendCancelledEmail은 cancelledBy='client'일 때 변호사에게만 발송
      // 상담자에게도 확인 이메일을 별도 발송
      await sendCancelledEmail(cancelledAppt, lawyer);

      // 상담자에게도 취소 확인 이메일
      const { render } = await import('@react-email/components');
      const AppointmentCancelled = (await import('@/emails/appointment-cancelled')).default;
      const { getResend, getEmailFrom } = await import('@/lib/email/client');
      const { formatInTimezone: fmt } = await import('@/lib/timezone');

      const tz = cancelledAppt.clientTimezone;
      const startFmt = fmt(cancelledAppt.slotStart.toDate(), tz, DATE_FORMAT);
      const endFmt = fmt(cancelledAppt.slotEnd.toDate(), tz, DATE_FORMAT);

      const html = await render(
        AppointmentCancelled({
          recipientName: cancelledAppt.client.name,
          cancelledBy: 'client',
          lawyerName: lawyer.name,
          clientName: cancelledAppt.client.name,
          slotStartFormatted: startFmt,
          slotEndFormatted: endFmt,
        }),
      );

      const resend = getResend();
      await resend.emails.send({
        from: getEmailFrom(),
        to: cancelledAppt.client.email,
        subject: `[예약 취소 완료] ${lawyer.name} 상담 예약이 취소되었습니다`,
        html,
      });
    }
  } catch (err) {
    console.error('[cancel-token] 이메일 발송 실패:', err);
  }

  return NextResponse.json({ success: true, message: '예약이 취소되었습니다.' });
}
