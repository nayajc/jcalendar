/**
 * Rate limiting 스켈레톤
 * Upstash Redis가 설정된 경우 Redis 기반 rate limiting,
 * 미설정 시 인메모리 LRU 폴백 (서버리스 환경에서는 프로세스 간 공유 불가 주의).
 */

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp (ms)
}

// 인메모리 폴백 (단일 프로세스 환경 전용)
const memoryStore = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1분
const MAX_REQUESTS = 5;       // 분당 최대 5회 (IP 기반)

function memoryRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { success: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS };
  }

  if (record.count >= MAX_REQUESTS) {
    return { success: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { success: true, remaining: MAX_REQUESTS - record.count, resetAt: record.resetAt };
}

/**
 * IP 기반 rate limiting
 * @param ip 클라이언트 IP 주소
 */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const key = `rate_limit:appointments:${ip}`;

  // Upstash Redis가 설정된 경우 Redis 사용
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Ratelimit } = await import('@upstash/ratelimit');
      const { Redis } = await import('@upstash/redis');

      const redis = Redis.fromEnv();
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(MAX_REQUESTS, '1 m'),
        analytics: false,
        prefix: 'rate_limit:appointments',
      });

      const result = await ratelimit.limit(ip);
      return {
        success: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
      };
    } catch (error) {
      console.error('[RateLimit] Redis 연결 실패, 인메모리 폴백 사용:', error);
    }
  }

  return memoryRateLimit(key);
}
