import type {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase-admin/firestore';
import type { Lawyer, Appointment, SlotLock } from '@/types';

// 월~금 09:00-18:00 (가입 시 기본값과 동일)
const DEFAULT_WORKING_HOURS = Object.fromEntries(
  Array.from({ length: 7 }, (_, i) => [
    i,
    { enabled: i >= 1 && i <= 5, start: '09:00', end: '18:00' },
  ])
);

export const lawyerConverter: FirestoreDataConverter<Lawyer> = {
  toFirestore(lawyer: Lawyer): DocumentData {
    return lawyer;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Lawyer {
    const data = snapshot.data();
    // 수동 생성/수정된 문서에 필수 필드가 빠져 있어도 위젯·슬롯 계산이 죽지 않도록 기본값을 채운다.
    const defaults: Partial<Lawyer> = {
      timezone: 'Asia/Seoul',
      slotLength: 60,
      bufferMinutes: 15,
      workingHours: DEFAULT_WORKING_HOURS,
      embedConfig: {},
      intakeQuestions: [],
    };
    return { ...defaults, ...data, id: snapshot.id } as Lawyer;
  },
};

export const appointmentConverter: FirestoreDataConverter<Appointment> = {
  toFirestore(appointment: Appointment): DocumentData {
    return appointment;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Appointment {
    const data = snapshot.data();
    return { id: snapshot.id, ...data } as Appointment;
  },
};

export const slotConverter: FirestoreDataConverter<SlotLock> = {
  toFirestore(slot: SlotLock): DocumentData {
    return slot;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): SlotLock {
    return snapshot.data() as SlotLock;
  },
};
