'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/server/authz';

/** farmerUserId is the farmer's User.id (see FarmFollow in schema.prisma), not FarmerProfile.id. */
export async function followFarmer(farmerUserId: string, storefrontPath: string) {
  const user = await requireUser();
  if (user.role !== 'BUYER') throw new Error('Only buyers can follow farms.');
  if (user.id === farmerUserId) throw new Error('You cannot follow yourself.');

  await prisma.farmFollow.upsert({
    where: { buyerId_farmerId: { buyerId: user.id, farmerId: farmerUserId } },
    create: { buyerId: user.id, farmerId: farmerUserId },
    update: {},
  });

  revalidatePath(storefrontPath);
  revalidatePath('/account');
  revalidatePath('/');
}

export async function unfollowFarmer(farmerUserId: string, storefrontPath: string) {
  const user = await requireUser();
  await prisma.farmFollow.deleteMany({ where: { buyerId: user.id, farmerId: farmerUserId } });

  revalidatePath(storefrontPath);
  revalidatePath('/account');
  revalidatePath('/');
}
