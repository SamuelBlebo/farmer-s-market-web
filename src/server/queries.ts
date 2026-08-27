import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { SortKey } from '@/lib/constants';

export type MarketFilters = {
  q?: string;
  category?: string;
  region?: string;
  min?: string;
  max?: string;
  verified?: string;
  featured?: string;
  delivery?: string;
  freshToday?: string;
  nearHarvest?: string;
  sort?: SortKey;
  page?: string;
};

const PAGE_SIZE = 24;
const WANTED_PAGE_SIZE = 12;
const ADMIN_PAGE_SIZE = 20;

const ORDER: Record<SortKey, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: 'desc' },
  price_asc: { priceMinor: 'asc' },
  price_desc: { priceMinor: 'desc' },
  quantity: { quantity: 'desc' },
};

const LIVE_PRODUCT_FARMER_CARD = {
  images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
  category: true,
  farmer: { select: { id: true, farmName: true, verification: true } },
  variants: { orderBy: { priceMinor: 'asc' as const }, take: 1, select: { priceMinor: true } },
} satisfies Prisma.ProductInclude;

/** The marketplace query. Only APPROVED + ACTIVE listings ever leave this function. */
export async function getMarketProducts(f: MarketFilters) {
  const page = Math.max(1, Number(f.page ?? 1) || 1);
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 86_400_000);

  // Each active filter contributes one AND'd condition — kept as a list
  // (rather than spreading onto one object) so the marketplace search's own
  // OR clause and the quick filters' OR clauses (fresh today) never collide.
  const and: Prisma.ProductWhereInput[] = [];
  if (f.q) {
    and.push({
      OR: [
        { name: { contains: f.q, mode: 'insensitive' } },
        { description: { contains: f.q, mode: 'insensitive' } },
        { town: { contains: f.q, mode: 'insensitive' } },
        { category: { name: { contains: f.q, mode: 'insensitive' } } },
        { farmer: { farmName: { contains: f.q, mode: 'insensitive' } } },
      ],
    });
  }
  if (f.category) and.push({ category: { slug: f.category } });
  if (f.region) and.push({ region: f.region });
  if (f.min || f.max) {
    and.push({
      priceMinor: {
        ...(f.min && { gte: Math.round(Number(f.min) * 100) }),
        ...(f.max && { lte: Math.round(Number(f.max) * 100) }),
      },
    });
  }
  if (f.verified === '1') and.push({ farmer: { verification: 'VERIFIED' } });
  if (f.featured === '1') and.push({ featured: true });
  if (f.delivery === '1') and.push({ deliveryAvailable: true });
  if (f.freshToday === '1') and.push({ OR: [{ expectedHarvestDate: null }, { expectedHarvestDate: { lte: now } }] });
  if (f.nearHarvest === '1') and.push({ expectedHarvestDate: { gt: now, lte: weekFromNow } });

  const where: Prisma.ProductWhereInput = {
    status: 'ACTIVE',
    moderation: 'APPROVED',
    ...(and.length > 0 && { AND: and }),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: ORDER[f.sort ?? 'newest'] ?? ORDER.newest,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: LIVE_PRODUCT_FARMER_CARD,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, pages: Math.ceil(total / PAGE_SIZE) };
}

export async function getProduct(id: string) {
  return prisma.product.findFirst({
    where: { id, moderation: 'APPROVED', status: { not: 'REMOVED' } },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      category: true,
      variants: { orderBy: { priceMinor: 'asc' } },
      farmer: {
        include: {
          // id is needed for the trust score's follower count (FarmFollow keys off User.id).
          user: { select: { id: true, name: true, lastActiveAt: true } },
          _count: { select: { products: { where: { status: 'ACTIVE', moderation: 'APPROVED' } } } },
        },
      },
    },
  });
}

/**
 * "People also viewed" — same category and/or same region ranked above the
 * rest, newest first within each tier. Only ever returns public (ACTIVE +
 * APPROVED) listings, same rule as the marketplace query.
 */
export async function getRelatedProducts(current: { id: string; categoryId: string; region: string }, take = 4) {
  const candidates = await prisma.product.findMany({
    where: {
      id: { not: current.id },
      status: 'ACTIVE',
      moderation: 'APPROVED',
      OR: [{ categoryId: current.categoryId }, { region: current.region }],
    },
    orderBy: { createdAt: 'desc' },
    take: 24,
    include: LIVE_PRODUCT_FARMER_CARD,
  });

  const ranked = candidates
    .map((p) => ({
      p,
      score: (p.categoryId === current.categoryId ? 2 : 0) + (p.region === current.region ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .map((s) => s.p);

  if (ranked.length >= take) return ranked.slice(0, take);

  // Not enough category/region matches — top up with anything else live.
  const exclude = [current.id, ...ranked.map((p) => p.id)];
  const fallback = await prisma.product.findMany({
    where: { id: { notIn: exclude }, status: 'ACTIVE', moderation: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: take - ranked.length,
    include: LIVE_PRODUCT_FARMER_CARD,
  });

  return [...ranked, ...fallback];
}

/** Best-effort browsing history for signed-in users — never blocks the page it's called from. */
export async function recordProductView(userId: string, productId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { recentlyViewedIds: true } });
    if (!user) return;
    const next = [productId, ...user.recentlyViewedIds.filter((id) => id !== productId)].slice(0, 10);
    await prisma.user.update({ where: { id: userId }, data: { recentlyViewedIds: next } });
  } catch {
    // Browsing history is a nice-to-have; never break the page over it.
  }
}

/** Recently viewed, newest first — order comes from the stored id list, not the DB, since `id in [...]` doesn't preserve it. */
export async function getRecentlyViewedProducts(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { recentlyViewedIds: true } });
  if (!user || user.recentlyViewedIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: user.recentlyViewedIds }, status: 'ACTIVE', moderation: 'APPROVED' },
    include: LIVE_PRODUCT_FARMER_CARD,
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return user.recentlyViewedIds.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
}

export async function getFarmer(id: string) {
  return prisma.farmerProfile.findUnique({
    where: { id },
    include: {
      // id is needed here (not just for display) because FarmFollow keys off
      // the farmer's User row, not FarmerProfile.id — see prisma/schema.prisma.
      user: { select: { id: true, image: true, lastActiveAt: true } },
      products: {
        where: { status: 'ACTIVE', moderation: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        include: LIVE_PRODUCT_FARMER_CARD,
      },
    },
  });
}

/** Only ever APPROVED reviews — same visibility rule as every other moderated content type here. */
export async function getFarmerReviews(farmerId: string, take = 20) {
  return prisma.review.findMany({
    where: { farmerId, moderation: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      // Business name, same identity buyers already show on Wanted requests — falls back to their name if somehow unset.
      buyer: { select: { name: true, buyerProfile: { select: { businessName: true } } } },
    },
  });
}

export async function getFarmerRatingSummary(farmerId: string) {
  const agg = await prisma.review.aggregate({
    where: { farmerId, moderation: 'APPROVED' },
    _avg: { rating: true },
    _count: true,
  });
  return { average: agg._avg.rating ?? 0, count: agg._count };
}

/** The signed-in buyer's own review, regardless of moderation status — so they see it even while pending. */
export async function getMyReview(farmerId: string, buyerUserId: string) {
  return prisma.review.findUnique({ where: { buyerId_farmerId: { buyerId: buyerUserId, farmerId } } });
}

/** Admin's editorial picks — same card, just a curated subset above the main grid. */
export async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { status: 'ACTIVE', moderation: 'APPROVED', featured: true },
    orderBy: { updatedAt: 'desc' },
    take: 8,
    include: LIVE_PRODUCT_FARMER_CARD,
  });
}

/** Lean suggestions for the search autocomplete — products (same match fields as the marketplace query), farmers, and categories, each capped small. */
export async function getSearchSuggestions(q: string) {
  const query = q.trim();
  if (!query) return { products: [], farmers: [], categories: [] };

  const [products, farmers, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        moderation: 'APPROVED',
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } },
          { farmer: { farmName: { contains: query, mode: 'insensitive' } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        unit: true,
        priceMinor: true,
        images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    prisma.farmerProfile.findMany({
      where: { farmName: { contains: query, mode: 'insensitive' } },
      take: 3,
      select: { id: true, farmName: true, region: true, verification: true },
    }),
    prisma.category.findMany({
      where: { active: true, name: { contains: query, mode: 'insensitive' } },
      take: 3,
      select: { slug: true, name: true },
    }),
  ]);

  return { products, farmers, categories };
}

export async function getCategories() {
  return prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
}

/** Homepage trust-line numbers — cheap counts, no row data. */
export async function getMarketStats() {
  const live = { status: 'ACTIVE' as const, moderation: 'APPROVED' as const };
  const [listings, verifiedFarmers, regions] = await Promise.all([
    prisma.product.count({ where: live }),
    prisma.farmerProfile.count({ where: { verification: 'VERIFIED' } }),
    prisma.product.findMany({ where: live, select: { region: true }, distinct: ['region'] }),
  ]);
  return { listings, verifiedFarmers, regionCount: regions.length };
}

export async function getFavorites(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: { userId, product: { status: { not: 'REMOVED' } } },
    orderBy: { createdAt: 'desc' },
    include: { product: { include: LIVE_PRODUCT_FARMER_CARD } },
  });
  return favorites.map((f) => f.product);
}

/** Only admin-approved requests ever leave this function — same rule as the marketplace query. */
export async function getWanted(page = 1) {
  const p = Math.max(1, page);
  const where: Prisma.WantedListingWhereInput = { status: 'OPEN', moderation: 'APPROVED' };

  const [items, total] = await Promise.all([
    prisma.wantedListing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (p - 1) * WANTED_PAGE_SIZE,
      take: WANTED_PAGE_SIZE,
      include: { buyer: true },
    }),
    prisma.wantedListing.count({ where }),
  ]);

  return { items, total, page: p, pages: Math.max(1, Math.ceil(total / WANTED_PAGE_SIZE)) };
}

/** A buyer's own requests, regardless of moderation status — for their status view. */
export async function getMyWanted(userId: string) {
  return prisma.wantedListing.findMany({
    where: { buyer: { userId } },
    orderBy: { createdAt: 'desc' },
  });
}

/** Admin: every listing regardless of status/moderation, newest first. */
export async function getAdminProducts(page = 1) {
  const p = Math.max(1, page);
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (p - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: { farmer: { select: { farmName: true } }, category: true, images: { take: 1, orderBy: { sortOrder: 'asc' } } },
    }),
    prisma.product.count(),
  ]);
  return { items, total, page: p, pages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

/** Admin: farmer verification list, paginated. */
export async function getAdminFarmers(page = 1) {
  const p = Math.max(1, page);
  const [items, total] = await Promise.all([
    prisma.farmerProfile.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (p - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: { user: { select: { lastActiveAt: true } } },
    }),
    prisma.farmerProfile.count(),
  ]);
  return { items, total, page: p, pages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

/** Admin: buyer list, paginated. */
export async function getAdminBuyers(page = 1) {
  const p = Math.max(1, page);
  const [items, total] = await Promise.all([
    prisma.buyerProfile.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (p - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: { user: { select: { lastActiveAt: true } } },
    }),
    prisma.buyerProfile.count(),
  ]);
  return { items, total, page: p, pages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

/** Whether this buyer already follows this farmer — farmerUserId is the farmer's User.id. */
export async function isFollowingFarmer(buyerId: string, farmerUserId: string) {
  const follow = await prisma.farmFollow.findUnique({
    where: { buyerId_farmerId: { buyerId, farmerId: farmerUserId } },
    select: { id: true },
  });
  return Boolean(follow);
}

/** Real follower count for a storefront — farmerUserId is the farmer's User.id. */
export async function getFollowerCount(farmerUserId: string) {
  return prisma.farmFollow.count({ where: { farmerId: farmerUserId } });
}

/** Batched version of getFollowerCount for lists (e.g. the admin Top Farmers table) — one groupBy instead of one count() per farmer. */
export async function getFollowerCounts(farmerUserIds: string[]) {
  if (farmerUserIds.length === 0) return new Map<string, number>();
  const counts = await prisma.farmFollow.groupBy({
    by: ['farmerId'],
    where: { farmerId: { in: farmerUserIds } },
    _count: true,
  });
  return new Map(counts.map((c) => [c.farmerId, c._count]));
}

/** Account Hub "Saved Farms" — cards reuse the same fields as the storefront hero. */
export async function getSavedFarms(buyerId: string) {
  const follows = await prisma.farmFollow.findMany({
    where: { buyerId },
    orderBy: { createdAt: 'desc' },
    select: {
      farmer: {
        select: {
          farmerProfile: {
            select: {
              id: true,
              farmName: true,
              coverImage: true,
              verification: true,
              region: true,
              town: true,
            },
          },
          image: true,
          lastActiveAt: true,
        },
      },
    },
  });

  // A followed farmer whose account/profile was since removed leaves a
  // dangling follow row rather than cascading away a live farm — skip those.
  const farms = follows
    .map((f) => f.farmer.farmerProfile && { ...f.farmer.farmerProfile, avatarUrl: f.farmer.image, lastActiveAt: f.farmer.lastActiveAt })
    .filter((f): f is NonNullable<typeof f> => Boolean(f));
  if (farms.length === 0) return [];

  const listingCounts = await prisma.product.groupBy({
    by: ['farmerId'],
    where: { farmerId: { in: farms.map((f) => f.id) }, status: 'ACTIVE', moderation: 'APPROVED' },
    _count: true,
  });
  const countByFarmerId = new Map(listingCounts.map((c) => [c.farmerId, c._count]));

  return farms.map((f) => ({ ...f, activeListings: countByFarmerId.get(f.id) ?? 0 }));
}

/** Homepage "From Farmers You Follow" — recent listings from farms this buyer follows. */
export async function getFollowedFarmsProducts(buyerId: string) {
  const follows = await prisma.farmFollow.findMany({
    where: { buyerId },
    select: { farmer: { select: { farmerProfile: { select: { id: true } } } } },
  });
  const farmerProfileIds = follows.map((f) => f.farmer.farmerProfile?.id).filter((id): id is string => Boolean(id));
  if (farmerProfileIds.length === 0) return [];

  return prisma.product.findMany({
    where: { farmerId: { in: farmerProfileIds }, status: 'ACTIVE', moderation: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: LIVE_PRODUCT_FARMER_CARD,
  });
}

/**
 * Every item here has a real underlying timestamp — nothing is invented.
 * New products/harvests use Product.createdAt (already fetched by the
 * storefront page, passed in rather than re-queried). Verification uses
 * FarmerProfile.verifiedAt. Follower milestones use the createdAt of the
 * Nth follow (the exact moment the threshold was actually crossed), from
 * one lightweight query over the same FarmFollow table getFollowerCount
 * already reads.
 */
const FOLLOWER_MILESTONES = [10, 25, 50, 100, 250, 500, 1000];

export type FarmActivityKind = 'harvest' | 'product' | 'verified' | 'followers';
export type FarmActivityItem = { icon: FarmActivityKind; message: string; at: Date };

export async function getFarmActivity(
  farmer: {
    verifiedAt: Date | null;
    products: { name: string; createdAt: Date; expectedHarvestDate: Date | null }[];
  },
  farmerUserId: string,
  take = 6,
): Promise<FarmActivityItem[]> {
  const items: FarmActivityItem[] = [];

  for (const p of farmer.products) {
    items.push(
      p.expectedHarvestDate
        ? { icon: 'harvest', message: `New harvest posted: ${p.name}`, at: p.createdAt }
        : { icon: 'product', message: `New product added: ${p.name}`, at: p.createdAt },
    );
  }

  if (farmer.verifiedAt) {
    items.push({ icon: 'verified', message: 'Farmer verified', at: farmer.verifiedAt });
  }

  const follows = await prisma.farmFollow.findMany({
    where: { farmerId: farmerUserId },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });
  for (const milestone of FOLLOWER_MILESTONES) {
    if (follows.length >= milestone) {
      items.push({ icon: 'followers', message: `Reached ${milestone} followers`, at: follows[milestone - 1].createdAt });
    }
  }

  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, take);
}

/**
 * Seasonal Produce Hub — Ready Now and Harvesting This Week reuse the exact
 * same conditions as the marketplace's freshToday/nearHarvest quick filters
 * (via getMarketProducts itself, not a re-implementation). Coming Soon has
 * no existing quick filter, so it's the one genuinely new condition here.
 */
export async function getSeasonalHub() {
  const weekFromNow = new Date(Date.now() + 7 * 86_400_000);

  const [readyNow, harvestingThisWeek, comingSoon] = await Promise.all([
    getMarketProducts({ freshToday: '1', sort: 'newest' }),
    getMarketProducts({ nearHarvest: '1', sort: 'newest' }),
    prisma.product.findMany({
      where: { status: 'ACTIVE', moderation: 'APPROVED', expectedHarvestDate: { gt: weekFromNow } },
      orderBy: { expectedHarvestDate: 'asc' },
      take: PAGE_SIZE,
      include: LIVE_PRODUCT_FARMER_CARD,
    }),
  ]);

  return { readyNow: readyNow.items, harvestingThisWeek: harvestingThisWeek.items, comingSoon };
}

/** Lean homepage preview — same "harvesting this week" rule as the Seasonal Hub, just a small take instead of the full paginated query. */
export async function getSeasonalPreview(take = 4) {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 86_400_000);
  return prisma.product.findMany({
    where: { status: 'ACTIVE', moderation: 'APPROVED', expectedHarvestDate: { gt: now, lte: weekFromNow } },
    orderBy: { expectedHarvestDate: 'asc' },
    take,
    include: LIVE_PRODUCT_FARMER_CARD,
  });
}

/** Farmer Dashboard's Harvest Calendar — next `days` days, reusing the same status field the marketplace/storefront already derive lifecycle from. */
export async function getUpcomingHarvests(farmerId: string, days = 30) {
  const now = new Date();
  const horizon = new Date(now.getTime() + days * 86_400_000);
  return prisma.product.findMany({
    where: { farmerId, status: 'ACTIVE', moderation: 'APPROVED', expectedHarvestDate: { gte: now, lte: horizon } },
    orderBy: { expectedHarvestDate: 'asc' },
    select: { id: true, name: true, expectedHarvestDate: true, status: true },
  });
}

/**
 * This Week summary for the farmer dashboard hero — reuses the exact same
 * Favorite/Product relation patterns already queried elsewhere in that page
 * (just with a date filter added), rather than going through analytics
 * events for counts the underlying tables already answer directly.
 */
export async function getWeeklyFarmerSummary(farmerId: string, farmerUserId: string) {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [newFollowers, savedListings, listingsPosted] = await Promise.all([
    prisma.farmFollow.count({ where: { farmerId: farmerUserId, createdAt: { gte: weekAgo } } }),
    prisma.favorite.count({ where: { product: { farmerId }, createdAt: { gte: weekAgo } } }),
    prisma.product.count({ where: { farmerId, createdAt: { gte: weekAgo } } }),
  ]);
  return { newFollowers, savedListings, listingsPosted };
}

/**
 * Trending Produce for the homepage — views (PRODUCT_VIEWED) and saves
 * (Favorite) and WhatsApp interest (WHATSAPP_CLICKED) combined into one
 * score, weighted toward the more deliberate actions. All three counts
 * come from tables/events that already exist; nothing here is estimated.
 */
export async function getTrendingProducts(take = 8) {
  const since = new Date(Date.now() - 30 * 86_400_000);

  const [viewEvents, whatsappEvents, saves] = await Promise.all([
    prisma.analyticsEvent.groupBy({ by: ['entityId'], where: { type: 'PRODUCT_VIEWED', entityId: { not: null }, createdAt: { gte: since } }, _count: true }),
    prisma.analyticsEvent.groupBy({ by: ['entityId'], where: { type: 'WHATSAPP_CLICKED', entityId: { not: null }, createdAt: { gte: since } }, _count: true }),
    prisma.favorite.groupBy({ by: ['productId'], where: { createdAt: { gte: since } }, _count: true }),
  ]);

  const score = new Map<string, number>();
  const bump = (id: string | null, points: number, weight: number) => {
    if (!id) return;
    score.set(id, (score.get(id) ?? 0) + points * weight);
  };
  for (const e of viewEvents) bump(e.entityId, e._count, 1);
  for (const e of whatsappEvents) bump(e.entityId, e._count, 5);
  for (const s of saves) bump(s.productId, s._count, 3);

  const productIds = [...score.keys()];
  if (productIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: 'ACTIVE', moderation: 'APPROVED' },
    include: LIVE_PRODUCT_FARMER_CARD,
  });

  return products
    .sort((a, b) => (score.get(b.id) ?? 0) - (score.get(a.id) ?? 0))
    .slice(0, take);
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: { product: { select: { id: true, images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } } } } },
  });
}
