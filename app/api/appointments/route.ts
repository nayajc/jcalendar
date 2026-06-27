import { NextRequest, NextResponse } from 'next/server';
import { verifyCaptcha } from '@/lib/captcha';
import { checkRateLimit } from '@/lib/rate-limit';
import { createAppointmentSchema } from '@/lib/validators';
import { createAppointment, ConflictError } from '@/lib/appointments/booking';
import { sendPendingEmails } from '@/lib/email/send';
import { adminDb } from '@/lib/firebase/admin';
import { lawyerConverter } from '@/lib/firebase/converters';
import { appointmentConverter } from '@/lib/firebase/converters';

export async function POST(req: NextRequest) {
  // IP 추출
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  try {
    const body = await req.json();

    // 1. Captcha 검증
    const captchaToken = body?.captchaToken;
    if (!captchaToken || typeof captchaToken !== 'string') {
      return NextResponse.json({ error: 'captchaToken이 필요합니다' }, { status: 400 });
    }

    const captchaValid = await verifyCaptcha(captchaToken, ip);
    if (!captchaValid) {
      return NextResponse.json({ error: 'Captcha 검증에 실패했습니다' }, { status: 400 });
    }

    // 2. Rate limit
    const rateResult = await checkRateLimit(ip);
    if (!rateResult.success) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    // 3. 입력값 검증
    const parseResult = createAppointmentSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: '입력값이 유효하지 않습니다', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // 4. 예약 생성 (슬롯 락 + appointment 문서)
    const appointmentId = await createAppointment(input);

    // 5. 이메일 발송 (실패해도 예약은 유지)
    try {
      const [appointmentSnap, lawyerSnap] = await Promise.all([
        adminDb.collection('appointments').doc(appointmentId).withConverter(appointmentConverter).get(),
        adminDb.collection('lawyers').doc(input.lawyerId).withConverter(lawyerConverter).get(),
      ]);
      const appointment = appointmentSnap.data();
      const lawyer = lawyerSnap.data();
      if (appointment && lawyer) {
        await sendPendingEmails(appointment, lawyer);
      }
    } catch (emailError) {
      console.error('[Appointment POST] 이메일 발송 실패:', emailError);
    }

    return NextResponse.json({ appointmentId }, { status: 201 });
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error('[Appointment POST] 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
