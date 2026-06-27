/**
 * 이메일 발송 모듈
 * Resend + React Email 템플릿을 사용하여 예약 상태별 이메일을 발송합니다.
 *
 * 타임존 포맷 규칙:
 *  - 상담자 대상 메일: appointment.clientTimezone 기준 포맷
 *  - 변호사 대상 메일: lawyer.timezone 기준 포맷
 *  - 표시 문자열에 타임존 약어 병기 (예: "2026-07-01 14:00 (KST)")
 */

import { render } from '@react-email/components';
import type { Appointment, Lawyer } from '@/types';
import { formatInTimezone } from '@/lib/timezone';
import { getResend, getEmailFrom } from './client';

import AppointmentPending from '@/emails/appointment-pending';
import LawyerNotification from '@/emails/lawyer-notification';
import AppointmentConfirmed from '@/emails/appointment-confirmed';
import AppointmentRejected from '@/emails/appointment-rejected';
import AppointmentCancelled from '@/emails/appointment-cancelled';
import AppointmentExpired from '@/emails/appointment-expired';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? '';
const DATE_FORMAT = "yyyy년 MM월 dd일 HH:mm (zzz)";

function formatSlot(
  appointment: Appointment,
  timezone: string,
): { start: string; end: string } {
  const start = appointment.slotStart.toDate();
  const end = appointment.slotEnd.toDate();
  return {
    start: formatInTimezone(start, timezone, DATE_FORMAT),
    end: formatInTimezone(end, timezone, DATE_FORMAT),
  };
}

function widgetUrl(appointment: Appointment): string {
  return `${BASE_URL}/widget/${appointment.lawyerId}`;
}

/**
 * 예약 생성 시 호출:
 *  - 변호사에게 "새 예약 알림" (lawyer.timezone 포맷)
 *  - 상담자에게 "예약 대기중" (clientTimezone 포맷)
 */
export async function sendPendingEmails(
  appointment: Appointment,
  lawyer: Lawyer,
): Promise<void> {
  const clientSlot = formatSlot(appointment, appointment.clientTimezone);
  const lawyerSlot = formatSlot(appointment, lawyer.timezone);
  const dashboardUrl = `${BASE_URL}/dashboard/appointments/${appointment.id}`;

  const [lawyerHtml, clientHtml] = await Promise.all([
    render(
      LawyerNotification({
        lawyerName: lawyer.name,
        clientName: appointment.client.name,
        clientPhone: appointment.client.phone,
        clientEmail: appointment.client.email,
        slotStartFormatted: lawyerSlot.start,
        slotEndFormatted: lawyerSlot.end,
        inquiry: appointment.inquiry,
        dashboardUrl,
      }),
    ),
    render(
      AppointmentPending({
        clientName: appointment.client.name,
        lawyerName: lawyer.name,
        slotStartFormatted: clientSlot.start,
        slotEndFormatted: clientSlot.end,
        inquiry: appointment.inquiry,
        widgetUrl: widgetUrl(appointment),
      }),
    ),
  ]);

  const resend = getResend();
  const EMAIL_FROM = getEmailFrom();
  await Promise.allSettled([
    resend.emails.send({
      from: EMAIL_FROM,
      to: lawyer.email,
      subject: `[새 예약] ${appointment.client.name}님 상담 요청 — ${lawyerSlot.start}`,
      html: lawyerHtml,
    }),
    resend.emails.send({
      from: EMAIL_FROM,
      to: appointment.client.email,
      subject: `[예약 접수] ${lawyer.name} 변호사 상담 예약이 접수되었습니다`,
      html: clientHtml,
    }),
  ]);
}

/**
 * 변호사 승인 시 호출:
 *  - 상담자에게 "예약 확정" (clientTimezone 포맷)
 */
export async function sendConfirmedEmail(
  appointment: Appointment,
  lawyer: Lawyer,
): Promise<void> {
  const clientSlot = formatSlot(appointment, appointment.clientTimezone);

  const html = await render(
    AppointmentConfirmed({
      clientName: appointment.client.name,
      lawyerName: lawyer.name,
      slotStartFormatted: clientSlot.start,
      slotEndFormatted: clientSlot.end,
      inquiry: appointment.inquiry,
    }),
  );

  const resend = getResend();
  await resend.emails.send({
    from: getEmailFrom(),
    to: appointment.client.email,
    subject: `[예약 확정] ${lawyer.name} 변호사 상담 — ${clientSlot.start}`,
    html,
  });
}

/**
 * 변호사 거절 시 호출:
 *  - 상담자에게 "예약 거절/불가" (clientTimezone 포맷)
 */
export async function sendRejectedEmail(
  appointment: Appointment,
  lawyer: Lawyer,
): Promise<void> {
  const clientSlot = formatSlot(appointment, appointment.clientTimezone);

  const html = await render(
    AppointmentRejected({
      clientName: appointment.client.name,
      lawyerName: lawyer.name,
      slotStartFormatted: clientSlot.start,
      slotEndFormatted: clientSlot.end,
      widgetUrl: widgetUrl(appointment),
    }),
  );

  const resend = getResend();
  await resend.emails.send({
    from: getEmailFrom(),
    to: appointment.client.email,
    subject: `[예약 거절] ${lawyer.name} 변호사 상담 예약을 수락하기 어렵습니다`,
    html,
  });
}

/**
 * 취소 시 호출:
 *  - 취소한 상대방에게 "취소" 이메일 발송
 *  - cancelledBy === 'lawyer': 상담자(client)에게 발송, 상담자 TZ 포맷
 *  - cancelledBy === 'client': 변호사에게 발송, 변호사 TZ 포맷
 */
export async function sendCancelledEmail(
  appointment: Appointment,
  lawyer: Lawyer,
): Promise<void> {
  const cancelledBy = appointment.cancelledBy ?? 'client';

  const resend = getResend();
  const EMAIL_FROM = getEmailFrom();
  if (cancelledBy === 'lawyer') {
    // 상담자에게 발송 (clientTimezone)
    const clientSlot = formatSlot(appointment, appointment.clientTimezone);
    const html = await render(
      AppointmentCancelled({
        recipientName: appointment.client.name,
        cancelledBy,
        lawyerName: lawyer.name,
        clientName: appointment.client.name,
        slotStartFormatted: clientSlot.start,
        slotEndFormatted: clientSlot.end,
        widgetUrl: widgetUrl(appointment),
      }),
    );
    await resend.emails.send({
      from: EMAIL_FROM,
      to: appointment.client.email,
      subject: `[예약 취소] ${lawyer.name} 변호사 상담 예약이 취소되었습니다`,
      html,
    });
  } else {
    // 변호사에게 발송 (lawyer.timezone)
    const lawyerSlot = formatSlot(appointment, lawyer.timezone);
    const html = await render(
      AppointmentCancelled({
        recipientName: lawyer.name,
        cancelledBy,
        lawyerName: lawyer.name,
        clientName: appointment.client.name,
        slotStartFormatted: lawyerSlot.start,
        slotEndFormatted: lawyerSlot.end,
      }),
    );
    await resend.emails.send({
      from: EMAIL_FROM,
      to: lawyer.email,
      subject: `[예약 취소] ${appointment.client.name}님이 상담 예약을 취소했습니다`,
      html,
    });
  }
}

/**
 * 만료 cron 호출:
 *  - 상담자에게 "만료, 재예약 안내" (clientTimezone 포맷)
 */
export async function sendExpiredEmail(
  appointment: Appointment,
  lawyer: Lawyer,
): Promise<void> {
  const clientSlot = formatSlot(appointment, appointment.clientTimezone);

  const html = await render(
    AppointmentExpired({
      clientName: appointment.client.name,
      lawyerName: lawyer.name,
      slotStartFormatted: clientSlot.start,
      slotEndFormatted: clientSlot.end,
      widgetUrl: widgetUrl(appointment),
    }),
  );

  const resend = getResend();
  await resend.emails.send({
    from: getEmailFrom(),
    to: appointment.client.email,
    subject: `[예약 만료] ${lawyer.name} 변호사 상담 예약이 만료되었습니다`,
    html,
  });
}
