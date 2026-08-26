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

/** Admin's editorial picks — same card, just a curated subset above the main grid. */
export async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { status: 'ACTIVE', moderation: 'APPROVED', featured: true },
    orderBy: { updatedAt: 'desc' },
    take: 8,
    include: LIVE_PRODUCT_FARMER_CARD,
  });
}

/** Lean suggestions for the search autocomplete — same match fields as the marketplace query, capped small. */
export async function getSearchSuggestions(q: string) {
  const query = q.trim();
  if (!query) return [];

  return prisma.product.findMany({
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
    take: 6,
    select: {
      id: true,
      name: true,
      unit: true,
      priceMinor: true,
      images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
      category: { select: { name: true, emoji: true } },
    },
  });
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
