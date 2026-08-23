'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { wantedSchema } from '@/lib/validation';
import { requireBuyerProfile, requireUser } from '@/server/authz';

export type WantedState = { error?: string; fieldErrors?: Record<string, string[]> };

export async function createWanted(_prev: WantedState, formData: FormData): Promise<WantedState> {
  const { profile } = await requireBuyerProfile();
  const parsed = wantedSchema.safeParse({
    productName: String(formData.get('productName') ?? ''),
    quantity: String(formData.get('quantity') ?? ''),
    region: formData.get('region'),
    town: String(formData.get('town') ?? ''),
    neededBy: String(formData.get('neededBy') ?? '') || undefined,
    description: String(formData.get('description') ?? '') || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  await prisma.wantedListing.create({
    data: {
      buyerId: profile.id,
      productName: d.productName,
      quantity: d.quantity,
      region: d.region,
      town: d.town,
      neededBy: d.neededBy ? new Date(d.neededBy) : null,
      description: d.description,
    },
  });

  revalidatePath('/wanted');
  redirect('/wanted?posted=1');
}

export async function closeWanted(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get('wantedId') ?? '');

  const listing = await prisma.wantedListing.findUnique({
    where: { id },
    include: { buyer: { select: { userId: true } } },
  });
  if (!listing) throw new Error('Request not found');
  if (user.role !== 'ADMIN' && listing.buyer.userId !== user.id) {
    throw new Error('You can only close your own requests');
  }

  await prisma.wantedListing.update({ where: { id }, data: { status: 'CLOSED' } });
  revalidatePath('/wanted');
}
