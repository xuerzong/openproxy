import { getRedis } from '@server/lib/redis'

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Fixed-window rate limiter backed by Redis (ioredis).
 * Compatible with the @upstash/ratelimit sliding-window concept but uses
 * a simple INCR + EXPIRE approach for efficiency.
 *
 * @param identifier - unique key (e.g. access token id)
 * @param limit      - max requests allowed in the window
 * @param window     - window duration in seconds (default 60)
 */
export const rateLimit = async (
  identifier: string,
  limit: number,
  window = 60
): Promise<RateLimitResult> => {
  const redis = getRedis()
  if (!redis) {
    // No Redis configured — allow the request (fail-open)
    return { success: true, limit, remaining: limit - 1, reset: 0 }
  }

  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - (now % window)
  const key = `openproxy:ratelimit:${identifier}:${windowStart}`

  const current = await redis.incr(key)
  if (current === 1) {
    await redis.expire(key, window)
  }

  const remaining = Math.max(0, limit - current)
  const reset = windowStart + window

  return {
    success: current <= limit,
    limit,
    remaining,
    reset,
  }
}
