import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { isRateLimited } from '@/lib/rate-limit';
import { POST as track } from '@/app/api/track/route';
import { anyCategoryId, cleanupUsers, createFarmer, createProduct } from './fixtures';

vi.mock('@/auth', () => ({ auth: vi.fn() }));

const userIds: string[] = [];
let farmer: Awaited<ReturnType<typeof createFarmer>>;
let product: Awaited<ReturnType<typeof createProduct>>;

beforeAll(async () => {
  vi.mocked(auth).mockResolvedValue(null as never);
  const categoryId = await anyCategoryId();
  farmer = await createFarmer();
  userIds.push(farmer.user.id);
  product = await createProduct(farmer.profile.id, categoryId);
});

afterAll(async () => {
  await cleanupUsers(userIds);
  await prisma.rateLimitBucket.deleteMany({ where: { key: { startsWith: 'test-' } } });
  await prisma.rateLimitBucket.deleteMany({ where: { key: { startsWith: 'track:test-' } } });
});

function trackRequest(body: unknown) {
  return new Request('http://localhost/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `test-${crypto.randomUUID()}` },
    body: JSON.stringify(body),
  });
}

describe('POST /api/track — entity validation', () => {
  it('rejects an unrecognized event type', async () => {
    const res = await track(trackRequest({ type: 'NOT_A_REAL_EVENT' }));
    expect(res.status).toBe(400);
  });

  it('rejects a click on an entity id that does not exist', async () => {
    const res = await track(trackRequest({ type: 'CALL_CLICKED', entityId: 'not-a-real-product-id' }));
    expect(res.status).toBe(400);

    const stored = await prisma.analyticsEvent.findFirst({ where: { entityId: 'not-a-real-product-id' } });
    expect(stored).toBeNull();
  });

  it('accepts a click on a real product and actually records it', async () => {
    const res = await track(trackRequest({ type: 'CALL_CLICKED', entityId: product.id }));
    expect(res.status).toBe(200);

    // track() is fire-and-forget (not awaited by the route), so give the
    // write a moment to land before checking for it.
    await new Promise((resolve) => setTimeout(resolve, 100));
    const stored = await prisma.analyticsEvent.findFirst({ where: { entityId: product.id, type: 'CALL_CLICKED' } });
    expect(stored).not.toBeNull();
  });

  it('accepts a click keyed on a farmer id too (WhatsApp/Chat clicks fire from the storefront as well)', async () => {
    const res = await track(trackRequest({ type: 'WHATSAPP_CLICKED', entityId: farmer.profile.id }));
    expect(res.status).toBe(200);
  });

  it('caps an oversized search query rather than storing it verbatim', async () => {
    const longQuery = 'a'.repeat(500);
    const res = await track(trackRequest({ type: 'SEARCH_PERFORMED', metadata: longQuery }));
    expect(res.status).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 100));
    const stored = await prisma.analyticsEvent.findFirst({
      where: { type: 'SEARCH_PERFORMED', metadata: { startsWith: 'aaaa' } },
      orderBy: { createdAt: 'desc' },
    });
    expect(stored?.metadata?.length).toBeLessThan(longQuery.length);
  });

  it('rejects a search query that is empty after trimming', async () => {
    const res = await track(trackRequest({ type: 'SEARCH_PERFORMED', metadata: '   ' }));
    expect(res.status).toBe(400);
  });
});

describe('isRateLimited', () => {
  it('allows requests under the limit and blocks once the limit is exceeded', async () => {
    const key = `test-rate-limit-${crypto.randomUUID()}`;
    expect(await isRateLimited(key, 3, 60_000)).toBe(false);
    expect(await isRateLimited(key, 3, 60_000)).toBe(false);
    expect(await isRateLimited(key, 3, 60_000)).toBe(false);
    expect(await isRateLimited(key, 3, 60_000)).toBe(true);
  });

  it('tracks separate keys independently', async () => {
    const keyA = `test-rate-limit-a-${crypto.randomUUID()}`;
    const keyB = `test-rate-limit-b-${crypto.randomUUID()}`;
    expect(await isRateLimited(keyA, 1, 60_000)).toBe(false);
    expect(await isRateLimited(keyA, 1, 60_000)).toBe(true);
    expect(await isRateLimited(keyB, 1, 60_000)).toBe(false);
  });
});
