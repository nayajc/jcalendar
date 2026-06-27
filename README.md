# Jolly Calendar

상담사를 위한 예약 캘린더 SaaS. 상담사가 가능 시간을 설정하면 고객이 위젯을 통해 예약을 신청하고, Google Calendar 연동과 이메일 알림으로 일정을 관리합니다.

## 주요 기능

- 상담사 대시보드에서 예약 확인/거절/취소 관리
- 고객용 임베드 위젯을 통한 예약 신청 (`/widget/[lawyerId]`)
- Google Calendar 연동 (OAuth, 토큰 AES-256-GCM 암호화 저장)
- 예약 만료 처리 및 24h/1h 전 리마인더 이메일 발송 (Resend)
- hCaptcha를 통한 위젯 봇 방지
- Upstash Redis 기반 Rate Limit (선택)
- PWA 지원 — 안드로이드 Chrome에서 홈 화면 설치 가능

## 기술 스택

- [Next.js 15](https://nextjs.org/) (App Router) / React 19 / TypeScript
- Firebase (Firestore + Admin SDK)
- Tailwind CSS 4
- date-fns / react-hook-form / zod

## 시작하기

```bash
npm install
cp .env.local.example .env.local   # 값 채우기
npm run dev
```

http://localhost:3000 에서 확인합니다.

## 환경 변수

`.env.local.example`을 참고해 `.env.local`을 작성합니다. 주요 항목:

| 항목 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase 클라이언트 설정 |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK (서버 전용, 비공개) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | Google Calendar OAuth |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | 캘린더 토큰 암호화 키 (`openssl rand -hex 32`) |
| `RESEND_API_KEY` / `EMAIL_FROM` | 이메일 발송 (Resend) |
| `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` / `HCAPTCHA_SECRET` | 위젯 봇 방지 |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate Limit (선택) |
| `CRON_SECRET` | Cron 엔드포인트 인증 (`openssl rand -hex 32`) |
| `APPOINTMENT_HOLD_HOURS` | 예약 임시 보류 시간 |
| `NEXT_PUBLIC_BASE_URL` | 배포 도메인 |

## Cron 작업

Vercel Hobby 플랜은 Cron이 1일 1회로 제한되므로, [cron-job.org](https://cron-job.org)(무료)에서 아래 두 작업을 15분 간격으로 등록합니다. 두 요청 모두 `Authorization: Bearer <CRON_SECRET>` 헤더가 필요합니다.

| 용도 | URL |
| --- | --- |
| 예약 만료 처리 | `/api/cron/expire-appointments` |
| 리마인더 이메일 발송 | `/api/cron/reminders` |

Vercel Pro 사용 시 `vercel.json`의 `crons` 설정으로 대체할 수 있습니다.

## 스크립트

```bash
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드
npm run start   # 프로덕션 서버 실행
npm run lint    # ESLint
```

## 디렉터리 구조

```
app/
  (auth)/        로그인 등 인증 관련 페이지
  (dashboard)/   상담사 대시보드
  api/           API 라우트 (appointments, auth, cron, upload 등)
  appointment/   예약 상세/관리 페이지
  widget/        고객용 임베드 위젯
  manifest.ts    PWA manifest
public/
  icons/         PWA 아이콘
  sw.js          서비스워커
```
