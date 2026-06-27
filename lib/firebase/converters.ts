import type {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase-admin/firestore';
import type { Lawyer, Appointment, SlotLock } from '@/types';

export const lawyerConverter: FirestoreDataConverter<Lawyer> = {
  toFirestore(lawyer: Lawyer): DocumentData {
    return lawyer;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Lawyer {
    const data = snapshot.data();
    return { id: snapshot.id, ...data } as Lawyer;
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
