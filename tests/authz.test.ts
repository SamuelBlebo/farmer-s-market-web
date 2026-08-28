import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { requireAdmin, requireUser, assertOwnsProduct } from '@/server/authz';
import { anyCategoryId, cleanupUsers, createAdmin, createBuyer, createFarmer, createProduct, sessionFor } from './fixtures';

vi.mock('@/auth', () => ({ auth: vi.fn() }));

const userIds: string[] = [];

let farmerA: Awaited<ReturnType<typeof createFarmer>>;
let farmerB: Awaited<ReturnType<typeof createFarmer>>;
let admin: Awaited<ReturnType<typeof createAdmin>>;
let buyer: Awaited<ReturnType<typeof createBuyer>>;
let productA: Awaited<ReturnType<typeof createProduct>>;

beforeAll(async () => {
  const categoryId = await anyCategoryId();
  farmerA = await createFarmer();
  farmerB = await createFarmer();
  admin = await createAdmin();
  buyer = await createBuyer();
  productA = await createProduct(farmerA.profile.id, categoryId);
  userIds.push(farmerA.user.id, farmerB.user.id, admin.user.id, buyer.user.id);
});

afterAll(async () => {
  await cleanupUsers(userIds);
});

describe('requireUser', () => {
  it('redirects when there is no session', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    await expect(requireUser()).rejects.toThrow('REDIRECT:/login');
  });

  it('returns the user when signed in', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(buyer.user) as never);
    const result = await requireUser();
    expect(result.id).toBe(buyer.user.id);
  });
});

describe('requireAdmin', () => {
  it('redirects a non-admin', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(buyer.user) as never);
    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/');
  });

  it('allows an admin', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(admin.user) as never);
    const result = await requireAdmin();
    expect(result.role).toBe('ADMIN');
  });

  it('reads the role from the database, not the (possibly stale) session token', async () => {
    // Simulate a demoted admin: the JWT still says ADMIN (as it would until
    // the token next refreshes), but the database — the source of truth —
    // has already been changed to BUYER.
    vi.mocked(auth).mockResolvedValue({
      user: { id: admin.user.id, role: 'ADMIN', name: admin.user.name, email: admin.user.email },
    } as never);
    await prisma.user.update({ where: { id: admin.user.id }, data: { role: 'BUYER' } });

    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/');

    // Restore for any later test/assertion in this file.
    await prisma.user.update({ where: { id: admin.user.id }, data: { role: 'ADMIN' } });
  });
});

describe('assertOwnsProduct', () => {
  it('throws for a farmer who does not own the listing', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(farmerB.user) as never);
    await expect(assertOwnsProduct(productA.id)).rejects.toThrow('You can only edit your own listings');
  });

  it('allows the owning farmer', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(farmerA.user) as never);
    const result = await assertOwnsProduct(productA.id);
    expect(result.id).toBe(productA.id);
  });

  it('allows an admin regardless of ownership', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(admin.user) as never);
    const result = await assertOwnsProduct(productA.id);
    expect(result.id).toBe(productA.id);
  });

  it('throws for a listing that does not exist', async () => {
    vi.mocked(auth).mockResolvedValue(sessionFor(farmerA.user) as never);
    await expect(assertOwnsProduct('not-a-real-id')).rejects.toThrow('Listing not found');
  });
});
