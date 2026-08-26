import { cache } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const LAST_ACTIVE_STALE_MS = 5 * 60_000;

/**
 * Best-effort "last active" tracking — refreshed at most once every 5 minutes
 * per user so a normal browsing session doesn't write on every request.
 * Never blocks or fails the request it's attached to.
 */
async function touchLastActive(userId: string, lastActiveAt: Date | null) {
  try {
    const stale = !lastActiveAt || Date.now() - lastActiveAt.getTime() > LAST_ACTIVE_STALE_MS;
    if (stale) await prisma.user.update({ where: { id: userId }, data: { lastActiveAt: new Date() } });
  } catch {
    // Activity tracking is a nice-to-have; never break the page over it.
  }
}

// cache() memoizes per request — Nav and the page itself both call
// currentUser(), and this keeps that to a single session lookup (and at
// most one lastActiveAt write) instead of one per caller.
export const currentUser = cache(async () => {
  const session = await auth();
  const sessionUser = session?.user ?? null;
  if (!sessionUser) return null;

  // Sessions are JWTs, so a cookie from before a `prisma migrate dev` reset
  // or reseed still decodes fine even though its user id no longer exists.
  // Treat that as signed-out here so no caller downstream (account actions,
  // ownership checks, etc.) ever runs a write against a row that's gone.
  const dbUser = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { lastActiveAt: true } });
  if (!dbUser) return null;

  await touchLastActive(sessionUser.id, dbUser.lastActiveAt);
  return sessionUser;
});

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'ADMIN') redirect('/');
  return user;
}

/** Returns the signed-in farmer's profile, or bounces them. */
export async function requireFarmerProfile() {
  const user = await requireUser();
  const profile = await prisma.farmerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect('/');
  return { user, profile };
}

export async function requireBuyerProfile() {
  const user = await requireUser();
  const profile = await prisma.buyerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect('/');
  return { user, profile };
}

/**
 * Ownership gate for listing writes. A farmer may only touch their own products;
 * an admin may touch any. Throws rather than redirects so actions fail loudly.
 */
export async function assertOwnsProduct(productId: string) {
  const user = await requireUser();
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { farmer: { select: { userId: true } } },
  });
  if (!product) throw new Error('Listing not found');
  if (user.role !== 'ADMIN' && product.farmer.userId !== user.id) {
    throw new Error('You can only edit your own listings');
  }
  return product;
}
