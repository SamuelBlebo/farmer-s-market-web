import { prisma } from '@/lib/prisma';
import { getConversations } from '@/server/chat';
import { getAdminSupportConversations, getLatestUnreadSupportReply } from '@/server/support';

export type FeedItemKind = 'moderation' | 'report' | 'farmer' | 'chat' | 'support' | 'rejected' | 'update';

export type FeedItem = {
  id: string;
  kind: FeedItemKind;
  message: string;
  subtext?: string;
  href: string;
  createdAt: Date;
};

function byRecency(a: FeedItem, b: FeedItem) {
  return b.createdAt.getTime() - a.createdAt.getTime();
}

/**
 * Live "needs attention right now" feed, same philosophy as the nav bell's
 * existing attention counts — not a persisted notification log. Items
 * naturally disappear once handled (approved, replied to, read) rather than
 * needing their own readAt tracking.
 */
export async function getAdminNotificationFeed(): Promise<FeedItem[]> {
  const newFarmerWindow = new Date(Date.now() - 7 * 86_400_000);

  const [pendingProducts, pendingWanted, pendingReviews, openReports, newFarmers, supportConversations] = await Promise.all([
    prisma.product.findMany({
      where: { moderation: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true, farmer: { select: { farmName: true } } },
      take: 20,
    }),
    prisma.wantedListing.findMany({
      where: { moderation: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, productName: true, createdAt: true, buyer: { select: { businessName: true } } },
      take: 20,
    }),
    prisma.review.findMany({
      where: { moderation: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        createdAt: true,
        farmer: { select: { farmName: true } },
        buyer: { select: { name: true, buyerProfile: { select: { businessName: true } } } },
      },
      take: 20,
    }),
    prisma.report.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, reason: true, createdAt: true, productId: true, product: { select: { name: true } } },
      take: 20,
    }),
    // "New" rather than the entire unverified backlog — verification is opt-in
    // prestige, not mandatory, so most farmers stay unverified indefinitely.
    // Recent signups are the genuinely notification-worthy signal.
    prisma.farmerProfile.findMany({
      where: { verification: { not: 'VERIFIED' }, createdAt: { gte: newFarmerWindow } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, farmName: true, createdAt: true },
      take: 20,
    }),
    getAdminSupportConversations(),
  ]);

  const items: FeedItem[] = [];

  for (const p of pendingProducts) {
    items.push({
      id: `product-${p.id}`,
      kind: 'moderation',
      message: 'New listing awaiting approval',
      subtext: `${p.name} · ${p.farmer.farmName}`,
      href: `/admin/products/${p.id}/edit`,
      createdAt: p.createdAt,
    });
  }
  for (const w of pendingWanted) {
    items.push({
      id: `wanted-${w.id}`,
      kind: 'moderation',
      message: 'New request awaiting approval',
      subtext: `${w.productName} · ${w.buyer.businessName}`,
      href: '/admin#buyer-requests',
      createdAt: w.createdAt,
    });
  }
  for (const r of pendingReviews) {
    items.push({
      id: `review-${r.id}`,
      kind: 'moderation',
      message: 'New review awaiting approval',
      subtext: `${r.rating}/5 · ${r.buyer.buyerProfile?.businessName ?? r.buyer.name} → ${r.farmer.farmName}`,
      href: '/admin#pending-reviews',
      createdAt: r.createdAt,
    });
  }
  for (const r of openReports) {
    items.push({
      id: `report-${r.id}`,
      kind: 'report',
      message: 'Listing reported',
      subtext: `${r.product.name} · ${r.reason}`,
      href: `/admin/products/${r.productId}/edit`,
      createdAt: r.createdAt,
    });
  }
  for (const f of newFarmers) {
    items.push({
      id: `farmer-${f.id}`,
      kind: 'farmer',
      message: 'New farmer — not yet verified',
      subtext: f.farmName,
      href: '/admin#farmer-verification',
      createdAt: f.createdAt,
    });
  }
  for (const c of supportConversations) {
    if (c.unreadCount === 0) continue;
    items.push({
      id: `support-${c.id}`,
      kind: 'support',
      message: `New message from ${c.userName}`,
      subtext: c.lastMessage ?? undefined,
      href: `/admin/support?id=${c.id}`,
      createdAt: c.lastMessageAt,
    });
  }

  return items.sort(byRecency);
}

export async function getFarmerNotificationFeed(userId: string, farmerProfileId: string): Promise<FeedItem[]> {
  const [rejectedProducts, conversations, latestSupportReply] = await Promise.all([
    prisma.product.findMany({
      where: { farmerId: farmerProfileId, moderation: 'REJECTED' },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, updatedAt: true },
      take: 20,
    }),
    getConversations(userId),
    getLatestUnreadSupportReply(userId),
  ]);

  const items: FeedItem[] = [];

  for (const p of rejectedProducts) {
    items.push({
      id: `product-rejected-${p.id}`,
      kind: 'rejected',
      message: 'Listing was rejected — needs changes',
      subtext: p.name,
      href: `/dashboard/listings/${p.id}/edit`,
      createdAt: p.updatedAt,
    });
  }
  for (const c of conversations) {
    if (c.unreadCount === 0) continue;
    items.push({
      id: `chat-${c.id}`,
      kind: 'chat',
      message: `New message from ${c.otherName}`,
      subtext: c.lastMessageIsVoice ? 'Voice message' : c.lastMessage ?? undefined,
      href: `/messages?id=${c.id}`,
      createdAt: c.lastMessageAt,
    });
  }
  if (latestSupportReply) {
    items.push({
      id: 'support-reply',
      kind: 'support',
      message: 'New reply from support',
      subtext: latestSupportReply.content,
      href: '/#support',
      createdAt: latestSupportReply.createdAt,
    });
  }

  return items.sort(byRecency);
}

export async function getBuyerAttentionFeed(userId: string, buyerProfileId: string): Promise<FeedItem[]> {
  const [rejectedWanted, conversations, latestSupportReply] = await Promise.all([
    prisma.wantedListing.findMany({
      where: { buyerId: buyerProfileId, moderation: 'REJECTED' },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, productName: true, updatedAt: true },
      take: 20,
    }),
    getConversations(userId),
    getLatestUnreadSupportReply(userId),
  ]);

  const items: FeedItem[] = [];

  for (const w of rejectedWanted) {
    items.push({
      id: `wanted-rejected-${w.id}`,
      kind: 'rejected',
      message: 'Your request was rejected',
      subtext: w.productName,
      href: '/wanted',
      createdAt: w.updatedAt,
    });
  }
  for (const c of conversations) {
    if (c.unreadCount === 0) continue;
    items.push({
      id: `chat-${c.id}`,
      kind: 'chat',
      message: `New message from ${c.otherName}`,
      subtext: c.lastMessageIsVoice ? 'Voice message' : c.lastMessage ?? undefined,
      href: `/messages?id=${c.id}`,
      createdAt: c.lastMessageAt,
    });
  }
  if (latestSupportReply) {
    items.push({
      id: 'support-reply',
      kind: 'support',
      message: 'New reply from support',
      subtext: latestSupportReply.content,
      href: '/#support',
      createdAt: latestSupportReply.createdAt,
    });
  }

  return items.sort(byRecency);
}
