import { NextRequest, NextResponse } from 'next/server';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { appointmentConverter, slotConverter, lawyerConverter } from '@/lib/firebase/converters';
import { getAuthenticatedLawyerId } from '@/lib/appointments/auth-helper';
import { createCalendarEvent, confirmCalendarEvent } from '@/lib/google-calendar/events';
import { sendConfirmedEmail } from '@/lib/email/send';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appointmentId } = await params;

  // 1. 인증
  const lawyerId = await getAuthenticatedLawyerId();
  if (!lawyerId) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const appointmentRef = adminDb
    .collection('appointments')
    .doc(appointmentId)
    .withConverter(appointmentConverter);

  try {
    // 2. 트랜잭션: appt + slot 단건 get → update
    await adminDb.runTransaction(async (tx) => {
      const apptSnap = await tx.get(appointmentRef);
      if (!apptSnap.exists) {
        throw Object.assign(new Error('예약을 찾을 수 없습니다'), { code: 404 });
      }

      const appt = apptSnap.data()!;

      // 소유권 확인
      if (appt.lawyerId !== lawyerId) {
        throw Object.assign(new Error('권한이 없습니다'), { code: 403 });
      }

      if (appt.status !== 'pending') {
        throw Object.assign(new Error(`현재 상태(${appt.status})에서 승인할 수 없습니다`), { code: 409 });
      }

      const slotRef = adminDb.collection('slots').doc(appt.slotId).withConverter(slotConverter);
      const slotSnap = await tx.get(slotRef);

      const now = Timestamp.now();

      // 만료 확인
      if (slotSnap.exists) {
        const slot = slotSnap.data()!;
        if (slot.holdExpiresAt.toMillis() <= now.toMillis()) {
          throw Object.assign(new Error('예약 유효시간이 만료되었습니다'), { code: 410 });
        }
        tx.update(slotRef, { status: 'confirmed' });
      }

      tx.update(appointmentRef, {
        status: 'confirmed',
        confirmedAt: now,
        updatedAt: now,
      });
    });

    // 3. Google Calendar 이벤트 생성 (트랜잭션 외부)
    const [apptSnap, lawyerSnap] = await Promise.all([
      appointmentRef.get(),
      adminDb.collection('lawyers').doc(lawyerId).withConverter(lawyerConverter).get(),
    ]);

    const appointment = apptSnap.data();
    const lawyer = lawyerSnap.data();

    if (appointment && lawyer && lawyer.googleCalendar) {
      try {
        // 대기중에 생성된 tentative 이벤트가 있으면 confirmed로 변경, 없으면 새로 생성
        const existingEventId = (appointment as { googleEventId?: string }).googleEventId;
        const googleEventId = existingEventId
          ? await confirmCalendarEvent(lawyer, appointment, existingEventId)
          : await createCalendarEvent(lawyer, appointment, 'confirmed');
        await appointmentRef.update({
          googleEventId,
          needsCalendarSync: FieldValue.delete(),
          updatedAt: Timestamp.now(),
        });

        // 이메일 발송 시 최신 appointment 사용
        const updatedAppt = { ...appointment, googleEventId };
        await sendConfirmedEmail(updatedAppt as typeof appointment, lawyer).catch((e) => {
          console.error('[Confirm] 이메일 발송 실패:', e);
        });
      } catch (calendarError) {
        // R-9: Calendar 실패 시 needsCalendarSync 플래그 후 계속
        console.error('[Confirm] Google Calendar 이벤트 생성 실패:', calendarError);
        await appointmentRef.update({
          needsCalendarSync: true,
          updatedAt: Timestamp.now(),
        });
        // 이메일은 Calendar 없이도 발송
        if (appointment && lawyer) {
          await sendConfirmedEmail(appointment, lawyer).catch((e) => {
            console.error('[Confirm] 이메일 발송 실패:', e);
          });
        }
      }
    } else if (appointment && lawyer) {
      // Google Calendar 미연결 변호사
      await sendConfirmedEmail(appointment, lawyer).catch((e) => {
        console.error('[Confirm] 이메일 발송 실패:', e);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const err = error as { code: number; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code });
    }
    console.error('[Confirm] 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
