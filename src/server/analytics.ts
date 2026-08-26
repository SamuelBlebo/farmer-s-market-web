import type { AnalyticsEventType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { captureException } from '@/lib/monitoring';

type TrackInput = {
  type: AnalyticsEventType;
  userId?: string | null;
  entityId?: string;
  metadata?: string;
};

/**
 * Best-effort, fire-and-forget — never awaited from a page render (see call
 * sites), so a slow or failed write never adds latency or breaks the
 * request it's attached to. Every event here is real user behavior, never
 * a fabricated or estimated number.
 */
export async function track(input: TrackInput): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        type: input.type,
        userId: input.userId ?? null,
        entityId: input.entityId,
        metadata: input.metadata?.slice(0, 200),
      },
    });
  } catch (error) {
    captureException(error, { context: 'analytics.track', type: input.type });
  }
}
