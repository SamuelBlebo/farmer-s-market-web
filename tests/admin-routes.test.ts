import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { moderateProduct, setFarmerVerification } from '@/server/actions/admin';
import { anyCategoryId, cleanupUsers, createAdmin, createBuyer, createFarmer, createProduct, sessionFor } from './fixtures';

vi.mock('@/auth', () => ({ auth: vi.fn() }));

const userIds: string[] = [];

let farmer: Awaited<ReturnType<typeof createFarmer>>;
let admin: Awaited<ReturnType<typeof createAdmin>>;
let buyer: Awaited<ReturnType<typeof createBuyer>>;
let pendingProduct: Awaited<ReturnType<typeof createProduct>>;

beforeAll(async () => {
  const categoryId = await anyCategoryId();
  farmer = await createFarmer();
  admin = await createAdmin();
  buyer = await createBuyer();
  pendingProduct = await createProduct(farmer.profile.id, categoryId, { moderation: 'PENDING' });
  userIds.push(farmer.user.id, admin.user.id, buyer.user.id);
});

afterAll(async () => {
  await cleanupUsers(userIds);
});

function formData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) fd.set(key, value);
  return fd;
}

describe('admin-only actions reject non-admins', () => {
  it('moderateProduct redirects a signed-in buyer, and the listing stays untouched', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(buyer.user) as never);
    await expect(
      moderateProduct(formData({ productId: pendingProduct.id, decision: 'APPROVED' })),
    ).rejects.toThrow('REDIRECT:/');

    const stillPending = await prisma.product.findUniqueOrThrow({ where: { id: pendingProduct.id } });
    expect(stillPending.moderation).toBe('PENDING');
  });

  it('moderateProduct redirects a signed-in farmer acting on someone else\'s listing', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(farmer.user) as never);
    await expect(
      moderateProduct(formData({ productId: pendingProduct.id, decision: 'APPROVED' })),
    ).rejects.toThrow('REDIRECT:/');
  });

  it('moderateProduct redirects an anonymous caller', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    await expect(
      moderateProduct(formData({ productId: pendingProduct.id, decision: 'APPROVED' })),
    ).rejects.toThrow('REDIRECT:/login');
  });

  it('setFarmerVerification redirects a non-admin', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(buyer.user) as never);
    await expect(
      setFarmerVerification(formData({ farmerId: farmer.profile.id, status: 'VERIFIED' })),
    ).rejects.toThrow('REDIRECT:/');

    const stillUnverified = await prisma.farmerProfile.findUniqueOrThrow({ where: { id: farmer.profile.id } });
    expect(stillUnverified.verification).not.toBe('VERIFIED');
  });

  it('an admin can actually perform the action the redirect was protecting', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(admin.user) as never);
    await moderateProduct(formData({ productId: pendingProduct.id, decision: 'APPROVED' }));

    const approved = await prisma.product.findUniqueOrThrow({ where: { id: pendingProduct.id } });
    expect(approved.moderation).toBe('APPROVED');
  });
});
