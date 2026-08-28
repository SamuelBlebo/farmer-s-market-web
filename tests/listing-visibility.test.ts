import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getProduct } from '@/server/queries';
import { anyCategoryId, cleanupUsers, createFarmer, createProduct } from './fixtures';

const userIds: string[] = [];

let farmer: Awaited<ReturnType<typeof createFarmer>>;
let approvedActive: Awaited<ReturnType<typeof createProduct>>;
let pending: Awaited<ReturnType<typeof createProduct>>;
let rejected: Awaited<ReturnType<typeof createProduct>>;
let removed: Awaited<ReturnType<typeof createProduct>>;

beforeAll(async () => {
  const categoryId = await anyCategoryId();
  farmer = await createFarmer();
  userIds.push(farmer.user.id);

  approvedActive = await createProduct(farmer.profile.id, categoryId, { moderation: 'APPROVED', status: 'ACTIVE' });
  pending = await createProduct(farmer.profile.id, categoryId, { moderation: 'PENDING', status: 'ACTIVE' });
  rejected = await createProduct(farmer.profile.id, categoryId, { moderation: 'REJECTED', status: 'ACTIVE' });
  removed = await createProduct(farmer.profile.id, categoryId, { moderation: 'APPROVED', status: 'REMOVED' });
});

afterAll(async () => {
  await cleanupUsers(userIds);
});

describe('getProduct (public listing visibility)', () => {
  it('returns a listing that is approved and not removed', async () => {
    const result = await getProduct(approvedActive.id);
    expect(result?.id).toBe(approvedActive.id);
  });

  it('hides a listing still awaiting moderation', async () => {
    expect(await getProduct(pending.id)).toBeNull();
  });

  it('hides a listing an admin rejected', async () => {
    expect(await getProduct(rejected.id)).toBeNull();
  });

  it('hides a removed listing even though moderation is approved', async () => {
    expect(await getProduct(removed.id)).toBeNull();
  });
});
