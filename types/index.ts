import type { Timestamp } from 'firebase-admin/firestore';

// -------------------------
// Lawyer (Tenant)
// -------------------------
export interface WorkingHourSlot {
  enabled: boolean;
  start: string; // "09:00" HH:mm
  end: string;   // "18:00" HH:mm
}

export interface GoogleCalendarConfig {
  calendarId: string;
  accessToken: string;  // AES-256-GCM 암호화
  refreshToken: string; // AES-256-GCM 암호화
  tokenExpiry: Timestamp;
}

export interface EmbedConfig {
  primaryColor?: string;
  customMessage?: string;
}

export interface Lawyer {
  id: string;
  name: string;
  email: string;
  timezone: string; // IANA timezone e.g. "Asia/Seoul"
  workingHours: Record<number, WorkingHourSlot>; // key = 요일 0~6 (0=일요일)
  slotLength: number;    // 분 단위
  bufferMinutes: number; // 슬롯 간 버퍼 (분)
  googleCalendar?: GoogleCalendarConfig;
  embedConfig: EmbedConfig;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// -------------------------
// Appointment
// -------------------------
export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export interface ClientInfo {
  name: string;
  phone: string;
  email: string;
}

export interface Appointment {
  id: string;
  lawyerId: string;
  slotStart: Timestamp;
  slotEnd: Timestamp;
  slotId: string; // `${lawyerId}_${slotStartUTC_ISO}`
  status: AppointmentStatus;
  holdExpiresAt: Timestamp;
  client: ClientInfo;
  clientTimezone: string; // IANA TZ
  inquiry: string;
  googleEventId?: string;
  confirmedAt?: Timestamp;
  rejectedAt?: Timestamp;
  cancelledAt?: Timestamp;
  cancelledBy?: 'lawyer' | 'client';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// -------------------------
// Slot Lock Document
// -------------------------
export type SlotStatus = 'held' | 'confirmed';

export interface SlotLock {
  lawyerId: string;
  slotStartUTC: Timestamp;
  slotEndUTC: Timestamp;
  appointmentId: string;
  status: SlotStatus;
  holdExpiresAt: Timestamp;
  createdAt: Timestamp;
}

// -------------------------
// Availability
// -------------------------
export interface AvailabilitySlot {
  start: string; // ISO UTC
  end: string;   // ISO UTC
}

// -------------------------
// Email Template Variables
// -------------------------
export interface AppointmentEmailVars {
  clientName: string;
  lawyerName: string;
  slotStartFormatted: string;
  slotEndFormatted: string;
  displayTimezone: string;
  inquiry: string;
  googleCalendarLink?: string;
}
