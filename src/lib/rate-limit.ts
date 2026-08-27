/**
 * In-memory sliding-window rate limiter, keyed by an arbitrary string
 * (usually a caller's IP). Resets on redeploy/restart and isn't shared
 * across server instances — fine at this app's scale; swap for a
 * Redis-backed limiter (e.g. Upstash) if it ever needs to survive across
 * multiple instances.
 */
const buckets = new Map<string, number[]>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    buckets.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return false;
}

/** Best-effort caller IP from standard proxy headers — good enough to key a rate limit, not for anything security-critical. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip') ?? 'unknown';
}
