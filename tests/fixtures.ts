import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import type { ModerationStatus, ProductStatus, Role } from '@prisma/client';

/** Deleting the User row cascades to its profile, products, conversations, everything — the only id a test needs to track. */
export async function cleanupUsers(ids: string[]) {
  if (ids.length === 0) return;
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

function uniquePhone(): string {
  // normalizeGhanaPhone-shaped: 233 + 9 digits, unique enough per test run.
  return `233${Date.now().toString().slice(-9)}${Math.floor(Math.random() * 9)}`;
}

export async function createFarmer(overrides: { name?: string } = {}) {
  const tag = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      email: `farmer-${tag}@test.local`,
      name: overrides.name ?? `Test Farmer ${tag}`,
      phone: uniquePhone(),
      passwordHash: 'x',
      role: 'FARMER' as Role,
      farmerProfile: {
        create: {
          farmName: `Test Farm ${tag}`,
          region: 'Ashanti',
          town: 'Kumasi',
          phone: uniquePhone(),
          whatsapp: uniquePhone(),
          verification: 'UNVERIFIED',
        },
      },
    },
    include: { farmerProfile: true },
  });
  return { user, profile: user.farmerProfile! };
}

export async function createBuyer(overrides: { name?: string } = {}) {
  const tag = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      email: `buyer-${tag}@test.local`,
      name: overrides.name ?? `Test Buyer ${tag}`,
      phone: uniquePhone(),
      passwordHash: 'x',
      role: 'BUYER' as Role,
      buyerProfile: {
        create: {
          businessName: `Test Business ${tag}`,
          region: 'Ashanti',
          town: 'Kumasi',
          phone: uniquePhone(),
          whatsapp: uniquePhone(),
        },
      },
    },
    include: { buyerProfile: true },
  });
  return { user, profile: user.buyerProfile! };
}

export async function createAdmin(overrides: { name?: string } = {}) {
  const tag = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      email: `admin-${tag}@test.local`,
      name: overrides.name ?? `Test Admin ${tag}`,
      phone: uniquePhone(),
      passwordHash: 'x',
      role: 'ADMIN' as Role,
    },
  });
  return { user };
}

/** Reuses whatever category the seed already created rather than making a throwaway one nothing else needs. */
export async function anyCategoryId(): Promise<string> {
  const category = await prisma.category.findFirst({ select: { id: true } });
  if (!category) throw new Error('No category found — run `npm run db:seed` before the test suite.');
  return category.id;
}

export async function createProduct(
  farmerId: string,
  categoryId: string,
  overrides: { moderation?: ModerationStatus; status?: ProductStatus; name?: string } = {},
) {
  return prisma.product.create({
    data: {
      farmerId,
      categoryId,
      name: overrides.name ?? 'Test Produce',
      priceMinor: 1000,
      unit: 'kg',
      quantity: 10,
      initialQty: 10,
      region: 'Ashanti',
      town: 'Kumasi',
      moderation: overrides.moderation ?? 'APPROVED',
      status: overrides.status ?? 'ACTIVE',
    },
  });
}

/** Matches the shape authz.ts/currentUser() puts on the session after its DB role read. */
export function sessionFor(user: { id: string; role: Role; name: string; email: string | null }) {
  return { user: { id: user.id, role: user.role, name: user.name, email: user.email } };
}
