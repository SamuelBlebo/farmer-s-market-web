import type { NotificationType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/** Fan out one row per follower. farmerUserId is the farmer's User.id (see FarmFollow). */
export async function notifyFollowers(farmerUserId: string, opts: { type: NotificationType; productId: string; message: string }) {
  const followers = await prisma.farmFollow.findMany({ where: { farmerId: farmerUserId }, select: { buyerId: true } });
  if (followers.length === 0) return;

  await prisma.notification.createMany({
    data: followers.map((f) => ({ userId: f.buyerId, type: opts.type, productId: opts.productId, message: opts.message })),
  });
}

/**
 * Best-effort, opportunistic sweep — there's no cron/websocket layer in this
 * app, so "a harvest becomes available" is detected the next time anyone
 * loads a page that calls this, not the instant it happens. Idempotent per
 * product via the `notifications: { none: ... } }` guard, so a repeat call
 * (every homepage load) never double-notifies the same listing.
 */
export async function notifyNewlyAvailableHarvests() {
  try {
    const candidates = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        moderation: 'APPROVED',
        expectedHarvestDate: { lte: new Date() },
        notifications: { none: { type: 'HARVEST_AVAILABLE' } },
      },
      select: { id: true, name: true, farmer: { select: { userId: true, farmName: true } } },
      take: 20,
    });

    for (const product of candidates) {
      await notifyFollowers(product.farmer.userId, {
        type: 'HARVEST_AVAILABLE',
        productId: product.id,
        message: `${product.name} from ${product.farmer.farmName} is now available.`,
      });
    }
  } catch {
    // Best-effort — never break the page over this.
  }
}

export async function markAllNotificationsRead(userId: string) {
  try {
    await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  } catch {
    // Best-effort — a missed read-receipt shouldn't break the page.
  }
}
