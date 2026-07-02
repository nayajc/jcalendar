import { z } from 'zod';

// 예약 생성 입력 스키마
export const createAppointmentSchema = z.object({
  lawyerId: z.string().min(1, '상담사 ID는 필수입니다'),
  slotStart: z.string().datetime({ message: '유효한 ISO 날짜시간 형식이어야 합니다' }),
  slotEnd: z.string().datetime({ message: '유효한 ISO 날짜시간 형식이어야 합니다' }),
  client: z.object({
    name: z.string().min(1, '이름은 필수입니다').max(100),
    phone: z
      .string()
      .min(1, '전화번호는 필수입니다')
      .regex(/^[\d\-\+\(\)\s]+$/, '유효한 전화번호 형식이어야 합니다'),
    email: z.string().email('유효한 이메일 주소여야 합니다'),
  }),
  clientTimezone: z.string().min(1, '타임존은 필수입니다'),
  inquiry: z.string().min(10, '문의 내용은 최소 10자 이상이어야 합니다').max(2000),
  captchaToken: z.string().min(1, 'hCaptcha 토큰은 필수입니다'),
  intakeAnswers: z.array(
    z.object({
      questionId: z.string(),
      label: z.string(),
      answer: z.string(),
    })
  ).optional(),
  attachments: z.array(
    z.object({
      name: z.string(),
      url: z.string().url(),
      size: z.number().int().positive(),
      contentType: z.string(),
    })
  ).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

// 변호사 설정 스키마
export const lawyerSettingsSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다').max(100),
  timezone: z.string().min(1, '타임존은 필수입니다'),
  slotLength: z.number().int().min(15).max(240),
  bufferMinutes: z.number().int().min(0).max(60),
  workingHours: z.record(
    z.string(),
    z.object({
      enabled: z.boolean(),
      start: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm 형식이어야 합니다'),
      end: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm 형식이어야 합니다'),
    })
  ),
  embedConfig: z.object({
    primaryColor: z.string().optional(),
    customMessage: z.string().max(500).optional(),
    logoUrl: z.string().url().optional().or(z.literal('')),
    introText: z.string().max(1000).optional(),
  }),
  intakeQuestions: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      required: z.boolean(),
    })
  ).optional(),
  blockedPeriods: z.array(
    z.object({
      id: z.string().min(1),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다'),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다'),
      label: z.string().max(100).optional(),
    })
  ).optional(),
});

export type LawyerSettingsInput = z.infer<typeof lawyerSettingsSchema>;

// 가용 슬롯 조회 쿼리 스키마
export const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다'),
  timezone: z.string().min(1, '타임존은 필수입니다'),
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

// 파일 업로드 검증 상수
export const UPLOAD_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const UPLOAD_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/x-hwp',
  'application/haansofthwp',
] as const;
export const UPLOAD_MAX_FILES = 5;
