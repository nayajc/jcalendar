/**
 * GET /api/cron/expire
 *
 * /api/cron/expire-appointments 의 별칭(alias) 엔드포인트.
 * cron-job.org 또는 Vercel Cron 설정에서 둘 중 하나를 사용할 수 있습니다.
 *
 * 실제 구현: app/api/cron/expire-appointments/route.ts
 */

export { GET } from '../expire-appointments/route';
