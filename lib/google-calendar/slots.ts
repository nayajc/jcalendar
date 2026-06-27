import { adminDb } from '@/lib/firebase/admin';
import { slotConverter } from '@/lib/firebase/converters';
import { workingHoursToUTC } from '@/lib/timezone';
import { getFreeBusy, type BusyInterval } from '@/lib/google-calendar/freebusy';
import { Timestamp } from 'firebase-admin/firestore';
import type { Lawyer, AvailabilitySlot } from '@/types';

function overlaps(
  slotStart: Date,
  slotEnd: Date,
  blocked: BusyInterval[]
): boolean {
  for (const b of blocked) {
    if (slotStart < b.end && slotEnd > b.start) {
      return true;
    }
  }
  return false;
}

/**
 * 특정 날짜의 가용 슬롯을 계산합니다.
 *
 * 알고리즘:
 *  1. targetDate를 변호사 timezone으로 변환해 요일 판별
 *  2. workingHours[dayOfWeek] 조회 (disabled이면 [] 반환)
 *  3. 업무시간 범위를 UTC로 변환
 *  4. Google freebusy 조회
 *  5. Firestore /slots 컬렉션에서 held/confirmed 점유 슬롯 조회
 *  6. blocked = merge(googleBusy, heldSlots)
 *  7. 후보 슬롯 생성 및 필터링
 */
export async function computeAvailableSlots(
  lawyer: Lawyer,
  targetDate: Date
): Promise<AvailabilitySlot[]> {
  // 1. 요일 판별 (변호사 timezone 기준)
  const lawyerLocalDate = new Intl.DateTimeFormat('en-US', {
    timeZone: lawyer.timezone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(targetDate);

  const weekdayPart = lawyerLocalDate.find((p) => p.type === 'weekday')?.value;
  const WEEKDAY_MAP: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const dayOfWeek = weekdayPart ? (WEEKDAY_MAP[weekdayPart] ?? -1) : -1;

  // 2. 업무시간 설정 확인
  const dayConfig = lawyer.workingHours[dayOfWeek];
  if (!dayConfig || !dayConfig.enabled) {
    return [];
  }

  // 3. 업무시간 → UTC
  const workStart = workingHoursToUTC(targetDate, dayConfig.start, lawyer.timezone);
  const workEnd = workingHoursToUTC(targetDate, dayConfig.end, lawyer.timezone);

  if (workStart >= workEnd) {
    return [];
  }

  // 4. Google freebusy 조회
  const googleBusy = await getFreeBusy(lawyer, workStart, workEnd);

  // 5. Firestore slots 컬렉션에서 점유 슬롯 조회
  const slotsSnapshot = await adminDb
    .collection('slots')
    .withConverter(slotConverter)
    .where('lawyerId', '==', lawyer.id)
    .where('slotStartUTC', '>=', Timestamp.fromDate(workStart))
    .where('slotStartUTC', '<', Timestamp.fromDate(workEnd))
    .get();

  const heldBusy: BusyInterval[] = slotsSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      start: data.slotStartUTC.toDate(),
      end: data.slotEndUTC.toDate(),
    };
  });

  // 6. blocked 구간 합치기
  const blocked: BusyInterval[] = [...googleBusy, ...heldBusy];

  // 7. 후보 슬롯 생성 (slotLength + bufferMinutes 간격)
  const slotMs = lawyer.slotLength * 60 * 1000;
  const bufferMs = lawyer.bufferMinutes * 60 * 1000;
  const stepMs = slotMs + bufferMs;

  const available: AvailabilitySlot[] = [];
  let cursor = workStart.getTime();

  while (cursor + slotMs <= workEnd.getTime()) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor + slotMs);

    if (!overlaps(slotStart, slotEnd, blocked)) {
      available.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
      });
    }

    cursor += stepMs;
  }

  return available;
}
