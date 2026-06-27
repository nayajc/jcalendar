import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';

/**
 * 변호사 업무시간 문자열("09:00")과 기준 날짜(UTC)를 받아
 * 해당 타임존의 그 시각을 UTC Date로 반환합니다.
 */
export function workingHoursToUTC(
  date: Date,
  timeStr: string,
  timezone: string
): Date {
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = parseInt(hoursStr ?? '0', 10);
  const minutes = parseInt(minutesStr ?? '0', 10);

  // 기준 날짜를 해당 타임존으로 변환
  const zonedDate = toZonedTime(date, timezone);

  // 시간/분을 업무시간으로 설정
  zonedDate.setHours(hours, minutes, 0, 0);

  // 타임존 기준 시각을 UTC로 변환
  return fromZonedTime(zonedDate, timezone);
}

/**
 * UTC Date를 특정 타임존의 포맷 문자열로 변환합니다.
 * formatStr 예시: "yyyy-MM-dd HH:mm (zzz)"
 */
export function formatInTimezone(
  date: Date,
  timezone: string,
  formatStr: string
): string {
  return format(toZonedTime(date, timezone), formatStr, { timeZone: timezone });
}

/**
 * IANA 타임존에서 약어를 추출합니다. (예: "Asia/Seoul" → "KST")
 * Intl.DateTimeFormat을 사용하여 브라우저/Node 모두 지원합니다.
 */
export function getTimezoneAbbreviation(timezone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? timezone;
  } catch {
    return timezone;
  }
}
