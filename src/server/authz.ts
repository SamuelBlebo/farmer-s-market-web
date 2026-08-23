import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}

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
