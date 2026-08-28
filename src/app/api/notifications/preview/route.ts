import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@/server/authz';
import { getAdminNotificationFeed, getBuyerAttentionFeed, getFarmerNotificationFeed, type FeedItem } from '@/server/notification-feed';
import { getNotifications } from '@/server/queries';

const PREVIEW_LIMIT = 8;

/** Small, capped feed for the notification bell's dropdown — the full list still lives at /notifications. */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  let items: FeedItem[] = [];

  if (user.role === 'ADMIN') {
    items = await getAdminNotificationFeed();
  } else if (user.role === 'FARMER') {
    const profile = await prisma.farmerProfile.findUniqueOrThrow({ where: { userId: user.id } });
    items = await getFarmerNotificationFeed(user.id, profile.id);
  } else {
    const profile = await prisma.buyerProfile.findUniqueOrThrow({ where: { userId: user.id } });
    const [attentionFeed, notifications] = await Promise.all([
      getBuyerAttentionFeed(user.id, profile.id),
      getNotifications(user.id),
    ]);
    const updateItems: FeedItem[] = notifications.map((n) => ({
      id: `update-${n.id}`,
      kind: 'update',
      message: n.message,
      href: n.product ? `/products/${n.product.id}` : '/',
      createdAt: n.createdAt,
    }));
    items = [...attentionFeed, ...updateItems].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  return NextResponse.json({
    items: items.slice(0, PREVIEW_LIMIT).map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    total: items.length,
  });
}
