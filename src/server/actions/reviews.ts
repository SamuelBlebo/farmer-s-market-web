'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { reviewSchema } from '@/lib/validation';
import { requireBuyerProfile } from '@/server/authz';

export type ReviewActionState = { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean };

/**
 * One review per buyer per farmer — a second submission edits the first
 * rather than creating a duplicate. Editing re-queues it for moderation
 * rather than leaving a stale approval on content that's since changed.
 */
export async function submitReview(_prev: ReviewActionState, formData: FormData): Promise<ReviewActionState> {
  const { user } = await requireBuyerProfile();
  const parsed = reviewSchema.safeParse({
    farmerId: formData.get('farmerId'),
    rating: formData.get('rating'),
    comment: String(formData.get('comment') ?? '') || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { farmerId, rating, comment } = parsed.data;
  await prisma.review.upsert({
    where: { buyerId_farmerId: { buyerId: user.id, farmerId } },
    create: { farmerId, buyerId: user.id, rating, comment, moderation: 'PENDING' },
    update: { rating, comment, moderation: 'PENDING' },
  });

  revalidatePath(`/farmers/${farmerId}`);
  revalidatePath('/admin');
  return { success: true };
}
