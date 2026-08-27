'use server';

import { prisma } from '@/lib/prisma';
import { feedbackSchema } from '@/lib/validation';
import { currentUser } from '@/server/authz';

export type FeedbackActionState = { error?: string; success?: boolean };

export async function submitFeedback(_prev: FeedbackActionState, formData: FormData): Promise<FeedbackActionState> {
  const parsed = feedbackSchema.safeParse({
    message: formData.get('message'),
    page: formData.get('page') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors.message?.[0] ?? 'Tell us what happened' };

  // Anonymous submissions are allowed — feedback shouldn't require an account.
  const user = await currentUser();
  await prisma.feedback.create({ data: { ...parsed.data, userId: user?.id } });

  return { success: true };
}
