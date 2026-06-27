import { google } from 'googleapis';
import { getAuthenticatedClient } from '@/lib/google-calendar/client';
import type { Lawyer } from '@/types';

export interface BusyInterval {
  start: Date;
  end: Date;
}

/**
 * Google Calendar freebusy API로 주어진 기간의 busy 구간을 반환합니다.
 * Google Calendar가 연결되지 않은 경우 빈 배열을 반환합니다.
 */
export async function getFreeBusy(
  lawyer: Lawyer,
  timeMin: Date,
  timeMax: Date
): Promise<BusyInterval[]> {
  if (!lawyer.googleCalendar) {
    return [];
  }

  const auth = await getAuthenticatedClient(lawyer);
  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: lawyer.googleCalendar.calendarId }],
    },
  });

  const calendarBusy =
    response.data.calendars?.[lawyer.googleCalendar.calendarId]?.busy ?? [];

  return calendarBusy
    .filter((b) => b.start && b.end)
    .map((b) => ({
      start: new Date(b.start!),
      end: new Date(b.end!),
    }));
}
