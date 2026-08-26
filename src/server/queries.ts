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
          user: { select: { name: true, lastActiveAt: true } },
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
      user: { select: { lastActiveAt: true } },
      products: {
        where: { status: 'ACTIVE', moderation: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        include: LIVE_PRODUCT_FARMER_CARD,
      },
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
