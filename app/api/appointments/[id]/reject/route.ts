import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { appointmentConverter, slotConverter, lawyerConverter } from '@/lib/firebase/converters';
import { getAuthenticatedLawyerId } from '@/lib/appointments/auth-helper';
import { deleteCalendarEvent } from '@/lib/google-calendar/events';
import { sendRejectedEmail } from '@/lib/email/send';

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
    let googleEventId: string | null = null;

    // 2. 상태 업데이트 + 슬롯 참조 저장
    await adminDb.runTransaction(async (tx) => {
      const apptSnap = await tx.get(appointmentRef);
      if (!apptSnap.exists) {
        throw Object.assign(new Error('예약을 찾을 수 없습니다'), { code: 404 });
      }

      const appt = apptSnap.data()!;

      if (appt.lawyerId !== lawyerId) {
        throw Object.assign(new Error('권한이 없습니다'), { code: 403 });
      }

      if (appt.status !== 'pending') {
        throw Object.assign(new Error(`현재 상태(${appt.status})에서 거절할 수 없습니다`), { code: 409 });
      }

      googleEventId = (appt as { googleEventId?: string }).googleEventId ?? null;
      const now = Timestamp.now();

      tx.update(appointmentRef, {
        status: 'rejected',
        rejectedAt: now,
        updatedAt: now,
      });

      // 슬롯 해제 (트랜잭션 내 단건 참조)
      const slotRef = adminDb.collection('slots').doc(appt.slotId).withConverter(slotConverter);
      const slotSnap = await tx.get(slotRef);
      if (slotSnap.exists) {
        tx.delete(slotRef);
      }
    });

    // 2-1. 대기중에 만든 tentative Google Calendar 이벤트 삭제
    if (googleEventId) {
      try {
        const lawyerSnap = await adminDb.collection('lawyers').doc(lawyerId).withConverter(lawyerConverter).get();
        const lawyer = lawyerSnap.data();
        if (lawyer) {
          await deleteCalendarEvent(lawyer, googleEventId);
        }
      } catch (calErr) {
        console.error('[Reject] Google 이벤트 삭제 실패:', calErr);
      }
    }

    // 3. 이메일 발송
    try {
      const [apptSnap, lawyerSnap] = await Promise.all([
        appointmentRef.get(),
        adminDb.collection('lawyers').doc(lawyerId).withConverter(lawyerConverter).get(),
      ]);
      const appointment = apptSnap.data();
      const lawyer = lawyerSnap.data();
      if (appointment && lawyer) {
        await sendRejectedEmail(appointment, lawyer);
      }
    } catch (emailError) {
      console.error('[Reject] 이메일 발송 실패:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const err = error as { code: number; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code });
    }
    console.error('[Reject] 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
