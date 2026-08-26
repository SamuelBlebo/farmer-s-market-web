import type { AnalyticsEventType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { computeTrustScore } from '@/lib/trust';
import { getFollowerCounts } from '@/server/queries';

type DateFilter = Date | undefined;

/** Six real counts from the last N days (or all time) — one groupBy, no per-metric round trips. */
export async function getAnalyticsOverview(since: DateFilter) {
  const counts = await prisma.analyticsEvent.groupBy({
    by: ['type'],
    where: since ? { createdAt: { gte: since } } : undefined,
    _count: true,
  });
  const byType = Object.fromEntries(counts.map((c) => [c.type, c._count])) as Partial<Record<AnalyticsEventType, number>>;

  return {
    productViews: byType.PRODUCT_VIEWED ?? 0,
    farmerViews: byType.FARMER_VIEWED ?? 0,
    whatsappClicks: byType.WHATSAPP_CLICKED ?? 0,
    callClicks: byType.CALL_CLICKED ?? 0,
    searches: byType.SEARCH_PERFORMED ?? 0,
    newFollows: byType.FARMER_FOLLOWED ?? 0,
  };
}

/** Views/WhatsApp/Call counts per product, live listings only, ranked by views. Two queries: group events, then fetch just the products that were actually touched. */
export async function getPopularProducts(since: DateFilter, take = 10) {
  const events = await prisma.analyticsEvent.groupBy({
    by: ['entityId', 'type'],
    where: {
      type: { in: ['PRODUCT_VIEWED', 'WHATSAPP_CLICKED', 'CALL_CLICKED'] },
      entityId: { not: null },
      ...(since && { createdAt: { gte: since } }),
    },
    _count: true,
  });

  const statsByProduct = new Map<string, { views: number; whatsapp: number; calls: number }>();
  for (const e of events) {
    if (!e.entityId) continue;
    const s = statsByProduct.get(e.entityId) ?? { views: 0, whatsapp: 0, calls: 0 };
    if (e.type === 'PRODUCT_VIEWED') s.views += e._count;
    else if (e.type === 'WHATSAPP_CLICKED') s.whatsapp += e._count;
    else if (e.type === 'CALL_CLICKED') s.calls += e._count;
    statsByProduct.set(e.entityId, s);
  }

  const productIds = [...statsByProduct.keys()];
  if (productIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: 'ACTIVE', moderation: 'APPROVED' },
    select: { id: true, name: true, farmer: { select: { farmName: true } } },
  });

  return products
    .map((p) => ({ id: p.id, name: p.name, farmName: p.farmer.farmName, ...statsByProduct.get(p.id)! }))
    .sort((a, b) => b.views - a.views)
    .slice(0, take);
}

/**
 * Followers, storefront views, active listings, trust score per farmer.
 * Reuses computeTrustScore and getFollowerCounts as-is — nothing here
 * recalculates what the storefront page already computes the same way.
 */
export async function getTopFarmers(since: DateFilter, take = 10) {
  const events = await prisma.analyticsEvent.groupBy({
    by: ['entityId'],
    where: { type: 'FARMER_VIEWED', entityId: { not: null }, ...(since && { createdAt: { gte: since } }) },
    _count: true,
  });

  const viewsByFarmerProfileId = new Map(events.filter((e) => e.entityId).map((e) => [e.entityId as string, e._count]));
  const farmerProfileIds = [...viewsByFarmerProfileId.keys()];
  if (farmerProfileIds.length === 0) return [];

  const farmers = await prisma.farmerProfile.findMany({
    where: { id: { in: farmerProfileIds } },
    select: {
      id: true,
      userId: true,
      farmName: true,
      verification: true,
      createdAt: true,
      user: { select: { lastActiveAt: true } },
      _count: { select: { products: { where: { status: 'ACTIVE', moderation: 'APPROVED' } } } },
    },
  });

  const followerCounts = await getFollowerCounts(farmers.map((f) => f.userId));

  return farmers
    .map((f) => {
      const followers = followerCounts.get(f.userId) ?? 0;
      const activeListings = f._count.products;
      const trustScore = computeTrustScore({
        verification: f.verification,
        lastActiveAt: f.user.lastActiveAt,
        activeListings,
        followers,
        memberSince: f.createdAt,
      });
      return {
        id: f.id,
        farmName: f.farmName,
        followers,
        storefrontViews: viewsByFarmerProfileId.get(f.id) ?? 0,
        activeListings,
        trustScore,
      };
    })
    .sort((a, b) => b.storefrontViews - a.storefrontViews)
    .slice(0, take);
}

/**
 * Search terms are stored as raw free text, so "Tomatoes" and "tomatoes "
 * would otherwise count separately — normalized (trim + lowercase) here in
 * one pass over one query's results, not via per-term queries.
 */
export async function getTopSearchTerms(since: DateFilter, take = 10) {
  const events = await prisma.analyticsEvent.findMany({
    where: { type: 'SEARCH_PERFORMED', metadata: { not: null }, ...(since && { createdAt: { gte: since } }) },
    select: { metadata: true },
  });

  const counts = new Map<string, number>();
  for (const e of events) {
    const term = e.metadata?.trim().toLowerCase();
    if (!term) continue;
    counts.set(term, (counts.get(term) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, take);
}

/**
 * Daily buckets for the activity chart. Deliberately always the last 7
 * days regardless of the page-wide date filter — Feature 6 specifies a
 * fixed 7-day trend view, which is a different question ("what does the
 * daily shape look like recently") than the filterable summary sections.
 */
export async function getDailyActivity(days = 7) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const events = await prisma.analyticsEvent.findMany({
    where: { type: { in: ['PRODUCT_VIEWED', 'WHATSAPP_CLICKED', 'CALL_CLICKED', 'SEARCH_PERFORMED'] }, createdAt: { gte: since } },
    select: { type: true, createdAt: true },
  });

  const buckets: { date: string; views: number; contacts: number; searches: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    buckets.push({ date: d.toISOString().slice(0, 10), views: 0, contacts: 0, searches: 0 });
  }
  const byDate = new Map(buckets.map((b) => [b.date, b]));

  for (const e of events) {
    const bucket = byDate.get(e.createdAt.toISOString().slice(0, 10));
    if (!bucket) continue;
    if (e.type === 'PRODUCT_VIEWED') bucket.views += 1;
    else if (e.type === 'WHATSAPP_CLICKED' || e.type === 'CALL_CLICKED') bucket.contacts += 1;
    else if (e.type === 'SEARCH_PERFORMED') bucket.searches += 1;
  }

  return buckets;
}

/** Listings come from Product.region (real, existing field); views join through the same PRODUCT_VIEWED events used elsewhere. */
export async function getRegionInsights(since: DateFilter) {
  const [listingsByRegion, viewEvents] = await Promise.all([
    prisma.product.groupBy({ by: ['region'], where: { status: 'ACTIVE', moderation: 'APPROVED' }, _count: true }),
    prisma.analyticsEvent.groupBy({
      by: ['entityId'],
      where: { type: 'PRODUCT_VIEWED', entityId: { not: null }, ...(since && { createdAt: { gte: since } }) },
      _count: true,
    }),
  ]);

  const productIds = viewEvents.filter((e) => e.entityId).map((e) => e.entityId as string);
  const products = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, region: true } })
    : [];
  const regionByProductId = new Map(products.map((p) => [p.id, p.region]));

  const viewsByRegion = new Map<string, number>();
  for (const e of viewEvents) {
    if (!e.entityId) continue;
    const region = regionByProductId.get(e.entityId);
    if (!region) continue;
    viewsByRegion.set(region, (viewsByRegion.get(region) ?? 0) + e._count);
  }

  const regions = new Set([...listingsByRegion.map((r) => r.region), ...viewsByRegion.keys()]);
  return [...regions]
    .map((region) => ({
      region,
      listings: listingsByRegion.find((r) => r.region === region)?._count ?? 0,
      views: viewsByRegion.get(region) ?? 0,
    }))
    .sort((a, b) => b.views - a.views || b.listings - a.listings);
}
