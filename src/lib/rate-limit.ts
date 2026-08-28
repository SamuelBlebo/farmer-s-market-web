import { prisma } from './prisma';
import { captureException } from './monitoring';

/**
 * Fixed-window rate limiter backed by the shared database, not per-instance
 * memory. Vercel serverless functions don't share memory across
 * invocations (or even across requests to the same function, reliably), so
 * an in-memory counter silently limits nothing once there's more than one
 * instance — this is the one that actually holds in production.
 *
 * windowStart is rounded down to the window size, so every caller within
 * the same window increments the same row; the row for a given window
 * simply stops accumulating once that window has passed. A fixed window
 * is slightly more permissive at the boundary than a true sliding window
 * (up to ~2x the limit across two adjacent windows), which is an
 * acceptable trade-off for the cost of a single upsert per call.
 */
export async function isRateLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  try {
    const bucket = await prisma.rateLimitBucket.upsert({
      where: { key_windowStart: { key, windowStart } },
      create: { key, windowStart, count: 1 },
      update: { count: { increment: 1 } },
    });
    return bucket.count > limit;
  } catch (error) {
    // Never let the limiter itself being unreachable block real traffic.
    captureException(error, { context: 'rate-limit', key });
    return false;
  }
}

/** Best-effort caller IP from standard proxy headers — good enough to key a rate limit, not for anything security-critical. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip') ?? 'unknown';
}
