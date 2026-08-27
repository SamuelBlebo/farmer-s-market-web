'use server';

import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { clientIp, isRateLimited } from '@/lib/rate-limit';
import { feedbackSchema } from '@/lib/validation';
import { currentUser } from '@/server/authz';

export type FeedbackActionState = { error?: string; success?: boolean };

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60_000;

export async function submitFeedback(_prev: FeedbackActionState, formData: FormData): Promise<FeedbackActionState> {
  if (isRateLimited(`feedback:${clientIp(headers())}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return { error: "You're sending feedback a bit fast — try again in a few minutes." };
  }

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
