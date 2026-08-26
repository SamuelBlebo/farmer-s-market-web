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

  const where: Prisma.ProductWhereInput = {
    status: 'ACTIVE',
    moderation: 'APPROVED',
    ...(f.q && {
      OR: [
        { name: { contains: f.q, mode: 'insensitive' } },
        { description: { contains: f.q, mode: 'insensitive' } },
        { town: { contains: f.q, mode: 'insensitive' } },
        { category: { name: { contains: f.q, mode: 'insensitive' } } },
        { farmer: { farmName: { contains: f.q, mode: 'insensitive' } } },
      ],
    }),
    ...(f.category && { category: { slug: f.category } }),
    ...(f.region && { region: f.region }),
    ...((f.min || f.max) && {
      priceMinor: {
        ...(f.min && { gte: Math.round(Number(f.min) * 100) }),
        ...(f.max && { lte: Math.round(Number(f.max) * 100) }),
      },
    }),
    ...(f.verified === '1' && { farmer: { verification: 'VERIFIED' } }),
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
