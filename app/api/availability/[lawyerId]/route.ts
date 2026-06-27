import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { lawyerConverter } from '@/lib/firebase/converters';
import { computeAvailableSlots } from '@/lib/google-calendar/slots';
import { availabilityQuerySchema } from '@/lib/validators';

interface RouteParams {
  params: Promise<{ lawyerId: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const { lawyerId } = await params;
  const { searchParams } = new URL(req.url);

  // 쿼리 파라미터 검증
  const parsed = availabilityQuerySchema.safeParse({
    date: searchParams.get('date'),
    timezone: searchParams.get('timezone'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: '유효하지 않은 요청 파라미터입니다', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { date } = parsed.data;

  // 변호사 정보 조회
  const lawyerSnap = await adminDb
    .collection('lawyers')
    .withConverter(lawyerConverter)
    .doc(lawyerId)
    .get();

  if (!lawyerSnap.exists) {
    return NextResponse.json({ error: '상담사를 찾을 수 없습니다' }, { status: 404 });
  }

  const lawyer = lawyerSnap.data()!;

  // 날짜 파싱 (YYYY-MM-DD → UTC Date)
  const targetDate = new Date(`${date}T00:00:00.000Z`);
  if (isNaN(targetDate.getTime())) {
    return NextResponse.json({ error: '유효하지 않은 날짜입니다' }, { status: 400 });
  }

  try {
    const slots = await computeAvailableSlots(lawyer, targetDate);

    return NextResponse.json(
      { slots },
      {
        headers: {
          // 5분 캐싱 (R-4 위험 완화)
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('[availability] 슬롯 계산 오류:', message);
    return NextResponse.json({ error: '슬롯 계산 중 오류가 발생했습니다' }, { status: 500 });
  }
}
