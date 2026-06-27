import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { appointmentConverter, slotConverter, lawyerConverter } from '@/lib/firebase/converters';
import { createCalendarEvent } from '@/lib/google-calendar/events';
import type { CreateAppointmentInput } from '@/lib/validators';

const HOLD_HOURS = parseInt(process.env.APPOINTMENT_HOLD_HOURS ?? '24', 10);

export class ConflictError extends Error {
  constructor(message = '이미 예약된 시간입니다') {
    super(message);
    this.name = 'ConflictError';
  }
}

/**
 * 예약 생성: 슬롯 락 문서를 runTransaction으로 원자적 점유 후
 * 트랜잭션 외부에서 appointment 문서를 생성합니다.
 */
export async function createAppointment(input: CreateAppointmentInput): Promise<string> {
  const {
    lawyerId,
    slotStart,
    slotEnd,
    client,
    clientTimezone,
    inquiry,
  } = input;

  const slotStartDate = new Date(slotStart);
  const slotEndDate = new Date(slotEnd);
  const slotStartUTC = slotStartDate.toISOString();

  // 슬롯 락 문서 ID: 결정적(deterministic)
  const slotDocId = `${lawyerId}_${slotStartUTC}`;
  const slotRef = adminDb.collection('slots').doc(slotDocId).withConverter(slotConverter);

  const now = Timestamp.now();
  const holdExpiresAt = Timestamp.fromMillis(Date.now() + HOLD_HOURS * 60 * 60 * 1000);

  // 임시 appointmentId 생성 (트랜잭션 전에 ref 생성)
  const appointmentRef = adminDb.collection('appointments').doc().withConverter(appointmentConverter);
  const appointmentId = appointmentRef.id;

  // 슬롯 락 트랜잭션: get(단건) → 존재 시 ConflictError, 없으면 set
  await adminDb.runTransaction(async (tx) => {
    const slotSnap = await tx.get(slotRef);
    if (slotSnap.exists) {
      throw new ConflictError('이미 예약된 시간입니다');
    }

    tx.set(slotRef, {
      lawyerId,
      slotStartUTC: Timestamp.fromDate(slotStartDate),
      slotEndUTC: Timestamp.fromDate(slotEndDate),
      appointmentId,
      status: 'held',
      holdExpiresAt,
      createdAt: now,
    });
  });

  // 트랜잭션 성공 후 appointment 문서 생성 (트랜잭션 외부)
  await appointmentRef.set({
    id: appointmentId,
    lawyerId,
    slotStart: Timestamp.fromDate(slotStartDate),
    slotEnd: Timestamp.fromDate(slotEndDate),
    slotId: slotDocId,
    status: 'pending',
    holdExpiresAt,
    client,
    clientTimezone,
    inquiry,
    createdAt: now,
    updatedAt: now,
  });

  // 대기중 단계에서도 변호사 Google Calendar에 'tentative(미정)' 이벤트로 표시.
  // 실패해도 예약 자체는 유지(needsCalendarSync 플래그) — 컨펌 시 재시도됨.
  try {
    const lawyerSnap = await adminDb
      .collection('lawyers')
      .doc(lawyerId)
      .withConverter(lawyerConverter)
      .get();
    const lawyer = lawyerSnap.data();

    if (lawyer?.googleCalendar) {
      const apptSnap = await appointmentRef.get();
      const appointment = apptSnap.data();
      if (appointment) {
        const googleEventId = await createCalendarEvent(lawyer, appointment, 'tentative');
        await appointmentRef.update({
          googleEventId,
          updatedAt: Timestamp.now(),
        });
      }
    }
  } catch (calendarError) {
    console.error('[Booking] tentative 이벤트 생성 실패:', calendarError);
    await appointmentRef.update({
      needsCalendarSync: true,
      updatedAt: Timestamp.now(),
    });
  }

  return appointmentId;
}
