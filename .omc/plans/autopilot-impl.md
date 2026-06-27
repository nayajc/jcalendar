# 변호사 상담 예약 캘린더 SaaS — 구현 계획

**Spec 기반:** `.omc/specs/deep-interview-lawyer-booking-saas.md`
**작성일:** 2026-06-27
**모드:** Direct (인터뷰 완료, 즉시 실행 가능)

---

## 1. 프로젝트 구조 / 디렉토리 레이아웃

```
reservation-cal/
├── app/                                   # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx                 # 변호사 로그인
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                     # 변호사 인증 guard
│   │   ├── dashboard/page.tsx             # 예약 목록 + 통계
│   │   ├── settings/
│   │   │   ├── page.tsx                   # 업무시간 / 슬롯 설정
│   │   │   └── google-calendar/page.tsx   # Google Calendar 연결
│   │   └── appointments/
│   │       └── [id]/page.tsx              # 예약 상세 + 승인/거절
│   ├── widget/
│   │   └── [lawyerId]/
│   │       ├── page.tsx                   # iframe 임베드 공개 예약 페이지
│   │       └── layout.tsx                 # X-Frame-Options 허용 layout
│   ├── api/
│   │   ├── auth/
│   │   │   ├── google-calendar/route.ts   # Google OAuth 콜백
│   │   │   └── session/route.ts           # Firebase 세션 쿠키 교환
│   │   ├── availability/
│   │   │   └── [lawyerId]/route.ts        # GET: 가용 슬롯 계산 반환
│   │   ├── appointments/
│   │   │   ├── route.ts                   # POST: 예약 생성 (hold + 이메일)
│   │   │   └── [id]/
│   │   │       ├── confirm/route.ts        # POST: 변호사 승인
│   │   │       ├── reject/route.ts         # POST: 변호사 거절
│   │   │       └── cancel/route.ts         # POST: 취소
│   │   └── cron/
│   │       └── expire-appointments/route.ts # GET: 만료 처리 (cron 호출)
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── widget/
│   │   ├── SlotPicker.tsx                 # 날짜/시간 슬롯 선택 UI
│   │   ├── BookingForm.tsx                # 문의 내용·전화·이메일 폼
│   │   └── ConfirmationView.tsx           # 예약 완료 화면
│   ├── dashboard/
│   │   ├── AppointmentCard.tsx
│   │   ├── AppointmentTable.tsx
│   │   └── WorkingHoursEditor.tsx
│   └── ui/                                # shadcn/ui 래퍼
├── lib/
│   ├── firebase/
│   │   ├── admin.ts                       # Firebase Admin SDK 초기화
│   │   ├── client.ts                      # Firebase Client SDK 초기화
│   │   └── converters.ts                  # Firestore 타입 변환
│   ├── google-calendar/
│   │   ├── client.ts                      # Google API 클라이언트 팩토리
│   │   ├── freebusy.ts                    # freebusy 조회
│   │   ├── slots.ts                       # 가용 슬롯 계산 알고리즘
│   │   └── events.ts                      # Calendar event insert/delete
│   ├── email/
│   │   ├── client.ts                      # Resend 클라이언트
│   │   ├── templates/
│   │   │   ├── appointment-pending.tsx    # React Email: 대기중
│   │   │   ├── appointment-confirmed.tsx  # React Email: 확정
│   │   │   ├── appointment-rejected.tsx   # React Email: 거절
│   │   │   ├── appointment-cancelled.tsx  # React Email: 취소
│   │   │   ├── appointment-expired.tsx    # React Email: 만료 → 재예약 안내
│   │   │   └── lawyer-notification.tsx    # React Email: 변호사 신규 예약 알림
│   │   └── sender.ts                      # 이메일 발송 함수 모음
│   ├── appointments/
│   │   ├── state-machine.ts               # 상태 전이 로직
│   │   └── transactions.ts                # Firestore 트랜잭션 (slot 점유 락 / confirm / 해제)
│   ├── timezone.ts                        # 타임존 유틸리티
│   ├── rate-limit.ts                      # 위젯 예약 생성 rate limiting (IP 기반)
│   ├── captcha.ts                         # hCaptcha 토큰 서버 검증
│   └── validators.ts                      # Zod 스키마
├── types/
│   └── index.ts                           # 공유 TypeScript 타입
├── firestore.rules                         # Firestore 보안 규칙
├── firebase.json
├── .env.local.example
└── middleware.ts                           # 인증 guard (App Router)
```

---

## 2. Firestore 데이터 모델

### 컬렉션 구조

#### `/lawyers/{lawyerId}`
```typescript
{
  id: string;                    // Firebase UID
  name: string;
  email: string;
  timezone: string;              // IANA timezone (e.g. "Asia/Seoul")
  workingHours: Record<number, { // key = 요일 0~6 (0=일요일)
    enabled: boolean;
    start: string;               // "09:00" (HH:mm, 변호사 현지시간)
    end: string;                 // "18:00"
  }>;
  slotLength: number;            // 분 단위 (예: 60)
  bufferMinutes: number;         // 슬롯 간 버퍼 (예: 15)
  googleCalendar?: {
    calendarId: string;
    accessToken: string;         // 암호화 저장 (AES-256)
    refreshToken: string;        // 암호화 저장
    tokenExpiry: Timestamp;
  };
  embedConfig: {
    primaryColor?: string;
    customMessage?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `/appointments/{appointmentId}`
```typescript
{
  id: string;
  lawyerId: string;              // lawyers/{lawyerId} 참조
  slotStart: Timestamp;          // UTC 기준
  slotEnd: Timestamp;            // UTC 기준
  slotId: string;                // 점유한 slot 문서 ID = `${lawyerId}_${slotStartUTC}` (해제 시 참조)
  status: 'pending' | 'confirmed' | 'rejected' | 'expired' | 'cancelled';
  holdExpiresAt: Timestamp;      // pending 상태의 만료 시각 (생성 + N시간). slot 문서에도 동일 값 복제(만료 쿼리용)
  client: {
    name: string;
    phone: string;
    email: string;
  };
  clientTimezone: string;        // IANA TZ. BookingForm에서 Intl.DateTimeFormat().resolvedOptions().timeZone로 자동 감지
  inquiry: string;               // 문의 내용
  googleEventId?: string;        // 확정 후 생성된 Calendar 이벤트 ID
  confirmedAt?: Timestamp;
  rejectedAt?: Timestamp;
  cancelledAt?: Timestamp;
  cancelledBy?: 'lawyer' | 'client';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `/slots/{lawyerId}_{slotStartUTC}` — 슬롯 점유 락 (이중예약 방지 핵심)

ID는 결정적(deterministic): `${lawyerId}_${slotStartUTC_ISO}`. 같은 변호사·같은 시작시각이면 항상 같은 문서 ID이므로, runTransaction `get()`(단건) → 없으면 `set()` 으로 원자적 점유가 가능하다. Firestore 트랜잭션 내부에서는 컬렉션 쿼리(`.where()`)가 불가능하고 단건 `get()`만 허용되므로, 슬롯을 고유 문서로 모델링하는 것이 이중예약 방지의 정석이다.

```typescript
{
  lawyerId: string;
  slotStartUTC: Timestamp;
  slotEndUTC: Timestamp;
  appointmentId: string;         // 이 슬롯을 점유한 예약
  status: 'held' | 'confirmed';  // held=pending 예약 점유, confirmed=확정
  holdExpiresAt: Timestamp;      // status=held일 때 만료 시각 (만료 cron 쿼리 대상)
  createdAt: Timestamp;
}
// 해제: 예약이 expired/rejected/cancelled가 되면 이 문서를 delete()
```

#### 인덱스 (Firestore composite)
- `appointments`: `(lawyerId, status, slotStart)` — 대시보드/슬롯 계산 보조용
- `slots`: `(status, holdExpiresAt)` — 만료 cron이 held 슬롯을 스캔하는 쿼리용
- `slots`: `(lawyerId, slotStartUTC)` — 가용 슬롯 계산 시 점유 슬롯 조회용

### Firestore 보안 규칙 개요 (`firestore.rules`)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 변호사 문서: 본인만 읽기/쓰기
    match /lawyers/{lawyerId} {
      allow read, write: if request.auth != null && request.auth.uid == lawyerId;
    }

    // 예약: 변호사(본인 건만) 읽기/업데이트. 생성은 서버 API(Admin SDK) 전용
    match /appointments/{appointmentId} {
      allow read, update: if request.auth != null
                          && request.auth.uid == resource.data.lawyerId;
      // create는 클라이언트 직접 불가 (Admin SDK가 규칙 우회). 위젯은 API Route 경유.
      allow create: if false;
    }

    // slots: 점유 락. 클라이언트 직접 접근 전면 차단 (Admin SDK 트랜잭션 전용)
    match /slots/{slotId} {
      allow read, write: if false;
    }
  }
}
```

> **Note:** 예약 생성/슬롯 점유/확정/거절/취소/만료의 모든 비즈니스 로직은 서버 API Route(Firebase Admin SDK)에서 처리한다. Admin SDK는 보안 규칙을 우회하므로, 클라이언트 규칙은 변호사 본인 데이터 읽기/업데이트만 허용하는 최소 권한으로 설정한다. 공개 위젯의 예약 생성도 클라이언트 직접 쓰기가 아니라 `/api/appointments` Route를 경유한다.

---

## 3. 인증 플로우

### 3-A. 변호사 로그인 (Firebase Auth)

```
1. 변호사 → /login 페이지
2. Firebase Auth (Email/Password 또는 Google Sign-In)
3. 로그인 성공 → idToken 취득
4. POST /api/auth/session: idToken → Firebase Admin verifyIdToken → HttpOnly 세션 쿠키 발급 (14일)
5. middleware.ts: 모든 /(dashboard)/* 요청에서 세션 쿠키 검증
```

**파일:** `app/api/auth/session/route.ts`
```typescript
// POST: { idToken } → set-cookie: session=<sessionCookie>; HttpOnly; Secure; SameSite=Strict
export async function POST(req: Request) {
  const { idToken } = await req.json();
  const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14일
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
  // Set-Cookie 헤더 설정
}
```

### 3-B. Google Calendar OAuth 연결

```
1. 변호사 → /dashboard/settings/google-calendar → "Google 캘린더 연결" 클릭
2. Google OAuth URL 생성 (scope: calendar.readonly + calendar.events)
   state 파라미터 = Firebase UID (CSRF 방지용 signed JWT)
3. Google → 콜백 /api/auth/google-calendar?code=...&state=...
4. code 교환 → { access_token, refresh_token, expiry_date }
5. 토큰을 AES-256으로 암호화 → Firestore /lawyers/{uid}.googleCalendar에 저장
6. 캘린더 목록 조회 → 기본 캘린더 ID 저장
```

**토큰 갱신:** `lib/google-calendar/client.ts`에서 API 호출 전 expiry 확인 → refresh 후 Firestore 업데이트.

---

## 4. Google Calendar 연동 모듈

### 4-A. 가용 슬롯 계산 알고리즘 (`lib/google-calendar/slots.ts`)

```
Input:
  - lawyerId: string
  - targetDate: Date (UTC)
  - lawyer: Lawyer (timezone, workingHours, slotLength, bufferMinutes)

Algorithm:
  1. targetDate를 변호사 timezone으로 변환 → 요일 판별
  2. workingHours[dayOfWeek] 가져오기 (disabled이면 [] 반환)
  3. workingHours의 start~end를 UTC Timestamp로 변환 (업무시간 범위)
  4. Google freebusy 조회 (lib/google-calendar/freebusy.ts):
     - timeMin = workStart, timeMax = workEnd
     - 반환: busy intervals[]
  5. Firestore 조회: slots where lawyerId == lawyerId
                          AND slotStartUTC >= workStart
                          AND slotStartUTC < workEnd
     → 점유 슬롯 intervals[] (held/confirmed 모두 차단). 트랜잭션 밖의 일반 쿼리이므로 .where() 사용 가능.
  6. blocked = merge(googleBusy, existingAppointments)
  7. candidateSlots = generateCandidates(workStart, workEnd, slotLength, bufferMinutes)
     // slotLength마다 슬롯 생성, 각 슬롯 = [start, start+slotLength]
  8. availableSlots = candidateSlots.filter(slot => !overlapsAny(slot, blocked))
  9. 반환: AvailabilitySlot[]

Output: { start: string (ISO UTC), end: string (ISO UTC) }[]
```

### 4-B. freebusy 조회 (`lib/google-calendar/freebusy.ts`)

```typescript
// Google Calendar API v3 freebusy.query
// items: [{ id: lawyer.googleCalendar.calendarId }]
// timeMin, timeMax: ISO 8601 UTC
// 반환: busy[] = { start, end }[]
```

### 4-C. Calendar 이벤트 생성/삭제 (`lib/google-calendar/events.ts`)

```typescript
// createCalendarEvent — 예약 확정 시 호출 (events.insert)
//   summary: "상담 예약 - {clientName}"
//   description: "문의: {inquiry}\n전화: {phone}\n이메일: {clientEmail}"
//   start: { dateTime: slotStart (ISO), timeZone: lawyer.timezone }
//   end:   { dateTime: slotEnd (ISO), timeZone: lawyer.timezone }
//   attendees: [{ email: clientEmail }]  // 선택적
// 반환: eventId → appointments/{id}.googleEventId에 저장

// deleteCalendarEvent(calendarId, eventId) — 확정 예약 취소 시 호출 (events.delete)
//   취소 API에서 appointment.googleEventId가 있으면 호출하여 Calendar 이벤트 제거.
//   이미 삭제됨(410/404) 에러는 무시(idempotent).
```

---

## 5. 공개 예약 위젯

### 5-A. 임베드 URL 구조

```
https://your-domain.com/widget/{lawyerId}
```

변호사 대시보드에서 임베드 스니펫 제공:
```html
<iframe
  src="https://your-domain.com/widget/LAWYER_ID"
  width="100%" height="700"
  frameborder="0"
  style="border-radius: 8px;">
</iframe>
```

### 5-B. iframe CORS / X-Frame-Options 처리

**`app/widget/[lawyerId]/layout.tsx`:**
```typescript
// next.config.ts에서 /widget/* 경로에만 적용
headers: [
  { key: 'X-Frame-Options', value: 'ALLOWALL' },         // 또는 삭제
  { key: 'Content-Security-Policy', value: "frame-ancestors *" }
]
```

**`next.config.ts`:**
```typescript
async headers() {
  return [{
    source: '/widget/:path*',
    headers: [
      { key: 'X-Frame-Options', value: 'ALLOWALL' },
      { key: 'Content-Security-Policy', value: "frame-ancestors *" },
    ],
  }];
}
```

### 5-C. 위젯 UX 플로우

```
Step 1: 날짜 선택 (캘린더 UI)
  → GET /api/availability/{lawyerId}?date=YYYY-MM-DD&timezone={clientTZ}
  → 슬롯 목록 표시 (클라이언트 타임존으로 변환하여 표시)

Step 2: 슬롯 선택

Step 3: 문의 폼 입력
  - 이름 (필수)
  - 전화번호 (필수)
  - 이메일 (필수)
  - 문의 내용 (필수, textarea)
  - clientTimezone: 폼에서 Intl.DateTimeFormat().resolvedOptions().timeZone로 자동 감지하여 hidden 필드로 전송
  - hCaptcha 위젯 (무료 플랜) → 토큰 발급

Step 4: POST /api/appointments { ..., clientTimezone, captchaToken } → 완료 화면
```

**컴포넌트:** `components/widget/SlotPicker.tsx`, `components/widget/BookingForm.tsx`, `components/widget/ConfirmationView.tsx`

슬롯은 서버에서 UTC로 반환 → 클라이언트에서 `Intl.DateTimeFormat`으로 브라우저 타임존 표시.

### 5-D. 봇/남용 방지 (공개 엔드포인트)

`/api/appointments` POST는 인증 없는 공개 엔드포인트이므로 다음을 적용한다:
- **Rate limiting** (`lib/rate-limit.ts`): IP당 분당 N회 제한. MVP는 인메모리 LRU(서버리스 한계 인지) 또는 Upstash Redis 권장.
- **hCaptcha** (`lib/captcha.ts`): 제출 토큰을 hCaptcha `siteverify`로 서버 검증 후에만 예약 생성 진행. hCaptcha 무료 플랜 사용.

---

## 6. 예약 상태 머신

### 상태 전이도

```
         [생성]
           ↓
        PENDING ──────────────────→ EXPIRED (holdExpiresAt 초과)
           │
    ┌──────┴──────┐
    ↓             ↓
CONFIRMED      REJECTED
    │
    ↓
CANCELLED (변호사 또는 상담자)
```

### 상태별 허용 전이 (`lib/appointments/state-machine.ts`)

| 현재 상태 | 허용 전이 | 조건 | slot 문서 처리 |
|----------|----------|------|----------------|
| pending  | confirmed | 변호사 승인 | slot.status = 'confirmed' |
| pending  | rejected  | 변호사 거절 | slot delete() (해제) |
| pending  | expired   | holdExpiresAt 초과 | slot delete() (해제) |
| confirmed | cancelled | 변호사 또는 상담자 | slot delete() + Google 이벤트 삭제 |
| rejected | — | 최종 상태 | — |
| expired  | — | 최종 상태 | — |
| cancelled | — | 최종 상태 | — |

> **재예약:** 별도 API 없음. 취소/거절/만료된 예약은 종결 상태이고, 상담자는 위젯에서 새 예약을 생성하는 방식으로 재예약한다. 슬롯이 해제되면(slot 문서 delete) 가용 슬롯 계산에 다시 노출된다.

### 이중예약 방지 — 슬롯 락 문서 방식 (`lib/appointments/transactions.ts`)

> **핵심 제약:** Firestore `runTransaction` 내부에서는 컬렉션 쿼리(`.where()`)가 **불가능**하며 단건 `get(docRef)`만 허용된다. 따라서 겹침 검사를 쿼리로 할 수 없다. 슬롯을 결정적 ID(`${lawyerId}_${slotStartUTC}`)를 가진 고유 문서로 모델링하여, 단건 get → set 패턴으로 원자적 점유한다. (슬롯 길이/시작 경계가 고정이므로 동일 시각=동일 슬롯 ID로 충돌 검출이 성립.)

**예약 생성 (slot hold):**
```typescript
// 사전(트랜잭션 외부): freebusy + 가용 슬롯 재검증, captcha 검증, rate-limit 통과
// const slotRef = db.doc(`slots/${lawyerId}_${slotStartUTC_ISO}`);
// runTransaction(async tx => {
//   const slot = await tx.get(slotRef);          // 단건 get만 사용
//   if (slot.exists) throw new ConflictError("이미 예약된 시간입니다");
//   tx.set(slotRef, {
//     lawyerId, slotStartUTC, slotEndUTC,
//     appointmentId, status: 'held',
//     holdExpiresAt: now + APPOINTMENT_HOLD_HOURS, createdAt: now,
//   });
// });
// 트랜잭션 성공 후(외부): appointments 문서 생성 (status:'pending', slotId, clientTimezone, holdExpiresAt 동일값)
// → 동시 요청은 동일 slotRef에 대한 트랜잭션 경합으로 한 건만 성공
```

**승인 (confirm):**
```typescript
// runTransaction(async tx => {
//   const apptSnap = await tx.get(apptRef);       // 단건 get
//   const slotSnap = await tx.get(slotRef);       // 단건 get
//   if (apptSnap.data().status !== 'pending') throw ConflictError;
//   if (slotSnap.data().holdExpiresAt <= now) throw ExpiredError; // 만료 후 승인 불가
//   tx.update(apptRef, { status: 'confirmed', confirmedAt: now });
//   tx.update(slotRef, { status: 'confirmed' });
// });
// 트랜잭션 성공 후(외부): Google Calendar event insert → googleEventId를 appt에 update
//   (Calendar insert 실패 시: appt에 needsCalendarSync 플래그 + 재시도/수동 처리)
```

**해제 (release — reject/cancel/expire 공통 헬퍼):**
```typescript
// releaseSlot(slotId): slot 문서 delete() → 가용 슬롯에 재노출
// cancel/reject/expire 처리 시 appt 상태 업데이트와 함께 호출
```

**holdExpiresAt 기본값:** 생성 시각 + 24시간 (환경변수 `APPOINTMENT_HOLD_HOURS=24`). appointments와 slots 양쪽에 동일 값 저장(만료 cron은 slots를 스캔).

---

## 7. 이메일 알림

### 서비스 선택: Resend + React Email

**이유:** Next.js 친화적 SDK, React Email로 타입 안전한 템플릿, 무료 티어 3,000통/월.

### 이메일 트리거 매핑 (`lib/email/sender.ts`)

| 이벤트 | 수신자 | 템플릿 |
|--------|--------|--------|
| 예약 생성 | 변호사 | `lawyer-notification.tsx` |
| 예약 생성 | 상담자 | `appointment-pending.tsx` |
| 변호사 승인 | 상담자 | `appointment-confirmed.tsx` |
| 변호사 거절 | 상담자 | `appointment-rejected.tsx` |
| 취소 | 상대방 | `appointment-cancelled.tsx` |
| 만료 (자동) | 상담자 | `appointment-expired.tsx` (예약 만료 + 재예약 안내) |

> **결정:** 컨펌 대기 만료 시 상담자에게 "예약이 만료되었습니다. 위젯에서 다시 예약해 주세요" 이메일을 발송한다(재예약 유도). 변호사에게는 만료 알림을 보내지 않는다(노이즈 방지, v2 재검토).

### 타임존별 포맷 규칙 (중요)

이메일에는 브라우저가 없으므로 발송 시점에 서버에서 `formatInTimezone()`(lib/timezone.ts)으로 미리 포맷한다.
- **상담자 대상 메일** (pending/confirmed/rejected/cancelled/expired): `appointment.clientTimezone`으로 포맷.
- **변호사 대상 메일** (lawyer-notification): `lawyer.timezone`으로 포맷.
- 혼선 방지를 위해 표시 문자열에 타임존 약어 병기 (예: "2026-07-01 14:00 (KST)").

### 템플릿 공통 변수

```typescript
// appointment-confirmed.tsx 예시
{
  clientName: string;
  lawyerName: string;
  slotStartFormatted: string;   // 수신자 기준 TZ로 이미 포맷된 문자열 (TZ 약어 포함)
  slotEndFormatted: string;
  displayTimezone: string;      // 표시에 사용한 IANA TZ (상담자=clientTimezone, 변호사=lawyer.timezone)
  inquiry: string;
  googleCalendarLink?: string;  // ics 다운로드 링크 (선택)
}
```

### 발송 실패 처리

- API Route에서 try/catch로 이메일 실패 로깅 (앱 플로우는 중단하지 않음)
- 향후 v2에서 Resend 웹훅 기반 재시도 큐 고려

---

## 8. 만료 처리 (스케줄드 작업)

### 아키텍처 선택: Next.js API Route + 외부 cron (cron-job.org)

**MVP 기본값: cron-job.org(무료 외부 cron)에서 15분 간격으로 호출.**

**이유:** Firebase Cloud Functions scheduled는 Blaze 플랜 필요. 또한 **Vercel Hobby(무료) 플랜의 Cron은 하루 1회 제약**이 있어 15분 간격이 불가능하다. 따라서 MVP는 외부 cron(cron-job.org, GitHub Actions schedule 등)에서 `/api/cron/expire-appointments`를 호출하는 것을 기본으로 한다. Vercel Cron(`vercel.json`)은 Pro 플랜에서만 분 단위 스케줄이 가능하므로 Pro 사용 시의 옵션으로만 표기한다.

### 만료 처리 API (`app/api/cron/expire-appointments/route.ts`)

```typescript
// GET /api/cron/expire-appointments
// Authorization: Bearer {CRON_SECRET} 헤더 검증

export async function GET(req: Request) {
  // 1. CRON_SECRET 환경변수로 인증
  // 2. Firestore 쿼리: slots where status == 'held' AND holdExpiresAt <= now
  //    (인덱스: slots (status, holdExpiresAt))
  // 3. 각 만료 슬롯에 대해:
  //    a. 연결된 appointment(slot.appointmentId) → status 'expired', updatedAt now
  //    b. slot 문서 delete() (슬롯 해제 → 재노출)
  //    c. 상담자에게 appointment-expired 이메일 발송 (clientTimezone으로 포맷)
  // 4. 처리 건수 반환
}
```

### cron 설정

**기본 (MVP) — cron-job.org:** `https://your-domain.com/api/cron/expire-appointments`를 15분 간격으로 등록, `Authorization: Bearer {CRON_SECRET}` 헤더 추가.

**옵션 — Vercel Pro (`vercel.json`):**
```json
{
  "crons": [{ "path": "/api/cron/expire-appointments", "schedule": "*/15 * * * *" }]
}
```
> Vercel Hobby는 cron이 1일 1회로 제한되어 15분 스케줄 불가. Pro 플랜에서만 사용. `CRON_SECRET`으로 무단 호출 방지.

---

## 9. 타임존 처리 전략

### 원칙

1. **저장:** 모든 Timestamp는 UTC (Firestore Timestamp는 UTC 기준)
2. **변호사 설정:** `lawyers.timezone` = IANA timezone string (e.g. "Asia/Seoul", "America/New_York")
3. **업무시간 변환:** 슬롯 계산 시 변호사 timezone의 "09:00"을 UTC로 변환
4. **위젯 표시:** 서버에서 UTC 슬롯 반환 → 브라우저 `Intl.DateTimeFormat`으로 상담자 로컬 타임존 표시. 폼 제출 시 감지된 TZ를 `appointment.clientTimezone`에 저장.
5. **이메일:** 브라우저가 없으므로 발송 시 서버에서 미리 포맷. 상담자 메일은 `appointment.clientTimezone`, 변호사 메일은 `lawyer.timezone` 기준으로 포맷하고 TZ 약어를 병기.

### 유틸리티 (`lib/timezone.ts`)

```typescript
import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';

// 변호사 업무시간 → UTC Timestamp
export function workingHoursToUTC(
  date: Date,          // 기준 날짜 (UTC)
  timeStr: string,     // "09:00"
  timezone: string     // "Asia/Seoul"
): Date;

// UTC → 타임존 표시 문자열
export function formatInTimezone(
  date: Date,
  timezone: string,
  formatStr: string
): string;
```

**의존 라이브러리:** `date-fns-tz` (date-fns 확장, 번들 크기 최소)

---

## 10. 구현 태스크 목록 (의존성 순서)

### Phase 0: 프로젝트 초기화 (병렬 불가)

| # | 태스크 | 파일 | 비고 |
|---|--------|------|------|
| 0-1 | Next.js 프로젝트 생성 (App Router, TypeScript) | `package.json`, `next.config.ts` | `npx create-next-app` |
| 0-2 | Firebase 프로젝트 설정, Admin/Client SDK 초기화 | `lib/firebase/admin.ts`, `lib/firebase/client.ts` | `.env.local.example` 작성 |
| 0-3 | shadcn/ui 설치 및 기본 컴포넌트 설정 | `components/ui/*` | Button, Input, Calendar, Select 등 |
| 0-4 | 공통 TypeScript 타입 정의 | `types/index.ts` | Lawyer, Appointment, AvailabilitySlot |
| 0-5 | Zod 검증 스키마 | `lib/validators.ts` | 예약 생성 입력, 설정 입력 |
| 0-6 | 타임존 유틸리티 | `lib/timezone.ts` | date-fns-tz 의존 |

### Phase 1: 인증 (Phase 0 완료 후)

| # | 태스크 | 파일 | 병렬 |
|---|--------|------|------|
| 1-1 | Firebase Auth 이메일/패스워드 로그인 페이지 | `app/(auth)/login/page.tsx` | — |
| 1-2 | 세션 쿠키 API Route | `app/api/auth/session/route.ts` | 1-1과 병렬 가능 |
| 1-3 | middleware.ts 인증 guard | `middleware.ts` | 1-2 완료 후 |
| 1-4 | Firestore 보안 규칙 작성 | `firestore.rules` | 1-3과 병렬 가능 |

### Phase 2: 변호사 설정 (Phase 1 완료 후)

| # | 태스크 | 파일 | 병렬 |
|---|--------|------|------|
| 2-1 | 업무시간·슬롯 설정 페이지 + API | `app/(dashboard)/settings/page.tsx` | — |
| 2-2 | WorkingHoursEditor 컴포넌트 | `components/dashboard/WorkingHoursEditor.tsx` | 2-1과 병렬 |
| 2-3 | Google OAuth URL 생성 + 연결 UI | `app/(dashboard)/settings/google-calendar/page.tsx` | 2-1과 병렬 |
| 2-4 | Google Calendar OAuth 콜백 처리 + 토큰 저장 | `app/api/auth/google-calendar/route.ts` | 2-3 의존 |
| 2-5 | Google API 클라이언트 + 토큰 갱신 로직 | `lib/google-calendar/client.ts` | 2-4와 병렬 |

### Phase 3: 가용 슬롯 계산 (Phase 2 완료 후)

| # | 태스크 | 파일 | 병렬 |
|---|--------|------|------|
| 3-1 | freebusy 조회 모듈 | `lib/google-calendar/freebusy.ts` | Phase 2-5(Google client) 완료에 의존 |
| 3-2 | 슬롯 계산 알고리즘 (업무시간 − Google busy − /slots 점유 문서) | `lib/google-calendar/slots.ts` | 3-1 의존 |
| 3-3 | 가용 슬롯 API Route | `app/api/availability/[lawyerId]/route.ts` | 3-2 의존 |

### Phase 4: 예약 위젯 (Phase 3 완료 후)

| # | 태스크 | 파일 | 병렬 |
|---|--------|------|------|
| 4-1 | SlotPicker 컴포넌트 | `components/widget/SlotPicker.tsx` | — |
| 4-2 | BookingForm 컴포넌트 (clientTimezone 자동 감지 + hCaptcha 위젯) | `components/widget/BookingForm.tsx` | 4-1과 병렬 |
| 4-3 | ConfirmationView 컴포넌트 | `components/widget/ConfirmationView.tsx` | 4-1과 병렬 |
| 4-4 | 위젯 페이지 + iframe 헤더 설정 | `app/widget/[lawyerId]/page.tsx`, `app/widget/[lawyerId]/layout.tsx`, `next.config.ts` | 4-1~3 의존 |

### Phase 5: 예약 생성 + 이중예약 방지 (Phase 4 완료 후)

| # | 태스크 | 파일 | 병렬 |
|---|--------|------|------|
| 5-1 | 상태 머신 로직 (전이 + slot 처리 매핑) | `lib/appointments/state-machine.ts` | — |
| 5-2 | Firestore 트랜잭션: slot 점유 락(get→set) / confirm / releaseSlot(delete) | `lib/appointments/transactions.ts` | 5-1 의존 |
| 5-3 | rate-limit + hCaptcha 검증 유틸 | `lib/rate-limit.ts`, `lib/captcha.ts` | 5-1과 병렬 |
| 5-4 | 예약 생성 API Route (captcha→rate-limit→slot hold 트랜잭션→appointment 생성) | `app/api/appointments/route.ts` | 5-2, 5-3 의존 |

### Phase 6: 이메일 알림 (Phase 5와 병렬 가능)

| # | 태스크 | 파일 | 병렬 |
|---|--------|------|------|
| 6-1 | Resend 클라이언트 설정 | `lib/email/client.ts` | — |
| 6-2 | 이메일 템플릿 6종 (pending/confirmed/rejected/cancelled/expired/lawyer-notification) | `lib/email/templates/*.tsx` | 6-1과 병렬 |
| 6-3 | 이메일 발송 함수 (수신자별 TZ 포맷: 상담자=clientTimezone, 변호사=lawyer.timezone) | `lib/email/sender.ts` | 6-1, 6-2 의존 |
| 6-4 | 예약 생성 API에 이메일 연동 | `app/api/appointments/route.ts` 수정 | 5-4, 6-3 의존 |

### Phase 7: 승인/거절/취소 + Calendar 이벤트 (Phase 5, 6 완료 후)

| # | 태스크 | 파일 | 병렬 |
|---|--------|------|------|
| 7-1 | Calendar 이벤트 생성/삭제 모듈 (createCalendarEvent + deleteCalendarEvent) | `lib/google-calendar/events.ts` | — |
| 7-2 | 승인 API Route (confirm 트랜잭션 → Calendar insert → 확정 메일) | `app/api/appointments/[id]/confirm/route.ts` | 7-1 의존 |
| 7-3 | 거절 API Route (status→rejected + releaseSlot + 거절 메일) | `app/api/appointments/[id]/reject/route.ts` | 7-2와 병렬 |
| 7-4 | 취소 API Route (status→cancelled + releaseSlot + googleEventId 있으면 deleteCalendarEvent + 취소 메일). 재예약은 위젯 신규 생성으로 처리(별도 API 없음) | `app/api/appointments/[id]/cancel/route.ts` | 7-1 의존 |
| 7-5 | 대시보드 예약 목록 + 상세 페이지 | `app/(dashboard)/dashboard/page.tsx`, `app/(dashboard)/appointments/[id]/page.tsx` | 7-2~4와 병렬 |

### Phase 8: 만료 처리 (Phase 5 완료 후, 다른 Phase와 병렬 가능)

| # | 태스크 | 파일 | 병렬 |
|---|--------|------|------|
| 8-1 | 만료 처리 Cron API Route (held slot 스캔 → appt expired + slot delete + 상담자 만료 메일) | `app/api/cron/expire-appointments/route.ts` | Phase 5, 6 완료 후 |
| 8-2 | 외부 cron(cron-job.org) 등록 문서 + (Pro용) vercel.json | `vercel.json`, `.env.local.example` | 8-1 의존 |

### Phase 9: 임베드 스니펫 + 마무리 (모든 Phase 완료 후)

| # | 태스크 | 파일 | 병렬 |
|---|--------|------|------|
| 9-1 | 대시보드 임베드 스니펫 복사 UI | `app/(dashboard)/settings/page.tsx` 수정 | — |
| 9-2 | Firestore 인덱스 설정 | `firestore.indexes.json` | — |
| 9-3 | 환경변수 문서화 | `.env.local.example` | — |
| 9-4 | E2E 시나리오 수동 검증 체크리스트 | `.omc/plans/verification-checklist.md` | — |

---

## 11. 위험 요소 및 결정 사항 (ADR)

### ADR-01: 이메일 서비스 — Resend 채택

**결정:** Resend + React Email

**드라이버:** Next.js/TypeScript 네이티브 통합, React 컴포넌트 기반 템플릿, 무료 3,000통/월

**대안 검토:**
- SendGrid: 기능 풍부하나 설정 복잡, 무료 100통/일
- Firebase Extensions (Trigger Email): Firestore 기반이나 커스터마이징 제한적
- Nodemailer + SMTP: 서버 설정 필요, Serverless 환경에서 불안정

**결과:** MVP에서 Resend 채택, v2에서 트래픽 증가 시 SendGrid 재평가

**후속 과제:** 이메일 발송 실패 시 재시도 큐 (v2)

---

### ADR-02: 만료 처리 — Next.js API Route + 외부 cron(cron-job.org)

**결정:** `/api/cron/expire-appointments` + cron-job.org(무료) 15분 간격. Vercel Cron은 Pro 플랜 옵션.

**드라이버:** Firebase Blaze 불필요. **Vercel Hobby Cron은 1일 1회 제약**이라 15분 간격 불가 → 외부 cron이 MVP 기본.

**대안 검토:**
- Vercel Hobby Cron: 1일 1회 제한 → MVP 요구(15분)에 부적합. 배제.
- Firebase Cloud Functions scheduled: Blaze 플랜 필요, 추가 비용
- Firestore TTL: status 필드 전이 불가(삭제만), 만료 메일 발송 불가 → 배제

**결과:** cron-job.org에서 15분마다 호출, held slot 스캔→만료 처리→상담자 만료 메일 발송. Vercel Pro 사용 시 vercel.json cron으로 대체 가능.

---

### ADR-03: 토큰 보안 — AES-256 암호화 후 Firestore 저장

**결정:** Google OAuth 토큰을 서버 사이드 AES-256-GCM으로 암호화 후 Firestore 저장

**드라이버:** Firestore 문서는 Firebase Admin으로만 접근 가능하나, 보안 규칙 실수 시 노출 위험 존재. 최소 위험 원칙.

**대안 검토:**
- 평문 저장: 단순하나 보안 취약
- Firebase Secret Manager: 이상적이나 변호사별 시크릿이 수백 개로 확장 불가
- Google Cloud KMS: 암호화 키 관리 최적이나 복잡도 증가

**결과:** `GOOGLE_TOKEN_ENCRYPTION_KEY` 환경변수로 AES-256-GCM 암호화

---

### ADR-04: 이중예약 방지 — 결정적 ID 슬롯 락 문서 + 트랜잭션 get/set

**결정:** `/slots/{lawyerId}_{slotStartUTC}` 고유 문서를 `runTransaction`으로 단건 `get()` → 없으면 `set()` 점유. Appointment 문서는 트랜잭션 외부 생성.

**드라이버:** Firestore 트랜잭션 내부에서는 컬렉션 쿼리(`.where()`)가 **불가능**하고 단건 `get(docRef)`만 허용된다. 따라서 "겹치는 예약을 쿼리로 찾아 막는" 방식은 트랜잭션 안에서 구현 불가. 결정적 문서 ID로 슬롯을 락 문서화하면 단건 get/set만으로 원자적 충돌 검출이 성립한다.

**대안 검토:**
- 트랜잭션 내 appointments `.where()` 쿼리: Firestore 제약상 불가 → 배제 (Critic 지적 CRITICAL-1).
- appointments 문서 자체를 결정적 ID로: 한 슬롯에 과거 취소/거절 이력이 누적되면 ID 충돌 → 별도 slots 락 컬렉션이 깔끔.

**완화:** freebusy/가용성 재검증은 트랜잭션 외부에서 선행. 트랜잭션은 slotRef get→set만 수행해 범위 최소화. 슬롯 해제는 slot 문서 delete().

---

### 위험 요소 목록

| # | 위험 | 영향도 | 완화 방법 |
|---|------|--------|----------|
| R-1 | Google OAuth 토큰 만료 중 슬롯 조회 실패 | 높음 | 토큰 갱신 로직 + 실패 시 "캘린더 연결 필요" 안내 |
| R-2 | 동시 예약 요청 race condition | 높음 | 결정적 ID slot 락 문서를 runTransaction get→set으로 원자 점유 (쿼리 불가 제약 회피) |
| R-7 | 확정 후 취소 시 Google 이벤트 잔존 | 중간 | 취소 API에서 googleEventId 있으면 deleteCalendarEvent 호출(idempotent) |
| R-8 | 공개 예약 엔드포인트 봇/스팸 | 중간 | rate-limit + hCaptcha 서버 검증 |
| R-9 | confirm 트랜잭션 성공 후 Calendar insert 실패 | 중간 | needsCalendarSync 플래그 후 재시도/수동, 예약 확정 자체는 유지 |
| R-3 | iframe CORS 이슈 (일부 브라우저 정책) | 중간 | `frame-ancestors *` CSP + X-Frame-Options ALLOWALL, SameSite 쿠키 설정 주의 |
| R-4 | freebusy API 응답 지연 (위젯 UX) | 중간 | 슬롯 조회 결과 5분 캐싱 (Next.js Route Cache), 로딩 스켈레톤 UI |
| R-5 | 이메일 발송 실패 시 사용자 혼란 | 낮음 | 앱 플로우 계속 진행 + 관리자 로그 기록 |
| R-6 | Vercel Hobby Cron 1일 1회 제한 | 중간 | MVP는 cron-job.org 외부 cron 15분 간격을 기본으로 채택 |

---

## 환경 변수 목록 (`.env.local.example`)

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Google Calendar OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google-calendar

# Token Encryption
GOOGLE_TOKEN_ENCRYPTION_KEY=          # 32바이트 hex (openssl rand -hex 32)

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=noreply@your-domain.com

# hCaptcha (위젯 봇 방지)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=
HCAPTCHA_SECRET=

# Rate limit (선택: Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Cron Security
CRON_SECRET=                          # openssl rand -hex 32

# Appointment Config
APPOINTMENT_HOLD_HOURS=24             # 컨펌 대기 만료 시간 (기본 24시간)

# App
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

---

## 의존성 패키지

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "firebase": "^11.0.0",
    "firebase-admin": "^13.0.0",
    "googleapis": "^148.0.0",
    "resend": "^4.0.0",
    "@react-email/components": "^0.0.27",
    "date-fns": "^4.0.0",
    "date-fns-tz": "^3.0.0",
    "zod": "^3.0.0",
    "react-hook-form": "^7.0.0",
    "@hookform/resolvers": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^22.0.0",
    "tailwindcss": "^4.0.0"
  }
}
```

---

*계획 완료. 실행 에이전트는 Phase 0부터 순서대로 진행하고, 동일 Phase 내 병렬 표시된 태스크는 동시에 진행 가능.*
