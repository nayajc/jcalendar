import { google } from 'googleapis';
import type { Lawyer, Appointment } from '@/types';
import { getAuthenticatedClient } from '@/lib/google-calendar/client';

/**
 * Google Calendar에 상담 이벤트를 생성합니다.
 * @param status 'tentative'(대기중) 또는 'confirmed'(확정). 기본값 'confirmed'.
 * @returns Google Calendar 이벤트 ID
 */
export async function createCalendarEvent(
  lawyer: Lawyer,
  appointment: Appointment,
  status: 'tentative' | 'confirmed' = 'confirmed'
): Promise<string> {
  if (!lawyer.googleCalendar) {
    throw new Error('Google Calendar가 연결되지 않았습니다');
  }

  const auth = await getAuthenticatedClient(lawyer);
  const calendar = google.calendar({ version: 'v3', auth });

  const prefix = status === 'tentative' ? '[대기중] ' : '';

  const response = await calendar.events.insert({
    calendarId: lawyer.googleCalendar.calendarId,
    requestBody: {
      summary: `${prefix}상담 예약 - ${appointment.client.name}`,
      status, // Google Calendar 이벤트 상태: tentative=미정, confirmed=확정
      description: [
        `문의: ${appointment.inquiry}`,
        `전화: ${appointment.client.phone}`,
        `이메일: ${appointment.client.email}`,
      ].join('\n'),
      start: {
        dateTime: appointment.slotStart.toDate().toISOString(),
        timeZone: lawyer.timezone,
      },
      end: {
        dateTime: appointment.slotEnd.toDate().toISOString(),
        timeZone: lawyer.timezone,
      },
      attendees: [{ email: appointment.client.email }],
    },
  });

  const eventId = response.data.id;
  if (!eventId) {
    throw new Error('Google Calendar 이벤트 ID를 받지 못했습니다');
  }

  return eventId;
}

/**
 * 기존 Google Calendar 이벤트를 '확정' 상태로 변경합니다.
 * (대기중 tentative 이벤트 → 확정 confirmed). 이벤트가 없으면(404/410) 새로 생성합니다.
 * @returns 최종 이벤트 ID
 */
export async function confirmCalendarEvent(
  lawyer: Lawyer,
  appointment: Appointment,
  eventId: string
): Promise<string> {
  if (!lawyer.googleCalendar) {
    throw new Error('Google Calendar가 연결되지 않았습니다');
  }

  const auth = await getAuthenticatedClient(lawyer);
  const calendar = google.calendar({ version: 'v3', auth });

  try {
    await calendar.events.patch({
      calendarId: lawyer.googleCalendar.calendarId,
      eventId,
      requestBody: {
        status: 'confirmed',
        summary: `상담 예약 - ${appointment.client.name}`,
      },
    });
    return eventId;
  } catch (error: unknown) {
    // 기존 tentative 이벤트가 사라졌으면(404/410) 새 confirmed 이벤트 생성
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error.code === 404 || error.code === 410)
    ) {
      return createCalendarEvent(lawyer, appointment, 'confirmed');
    }
    throw error;
  }
}

/**
 * Google Calendar 이벤트를 삭제합니다. 이미 삭제된 경우(404/410) 무시합니다(idempotent).
 */
export async function deleteCalendarEvent(
  lawyer: Lawyer,
  eventId: string
): Promise<void> {
  if (!lawyer.googleCalendar) {
    return; // Google Calendar 미연결 시 무시
  }

  try {
    const auth = await getAuthenticatedClient(lawyer);
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
      calendarId: lawyer.googleCalendar.calendarId,
      eventId,
    });
  } catch (error: unknown) {
    // 이미 삭제됨(404/410) 에러는 무시
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error.code === 404 || error.code === 410)
    ) {
      return;
    }
    throw error;
  }
}
