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

const ORDER: Record<SortKey, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: 'desc' },
  price_asc: { priceMinor: 'asc' },
  price_desc: { priceMinor: 'desc' },
  quantity: { quantity: 'desc' },
};

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
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        category: true,
        farmer: { select: { id: true, farmName: true, verification: true } },
      },
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
      farmer: { include: { user: { select: { name: true } } } },
    },
  });
}

export async function getFarmer(id: string) {
  return prisma.farmerProfile.findUnique({
    where: { id },
    include: {
      products: {
        where: { status: 'ACTIVE', moderation: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        include: { images: { take: 1 }, category: true, farmer: { select: { id: true, farmName: true, verification: true } } },
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
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          category: true,
          farmer: { select: { id: true, farmName: true, verification: true } },
        },
      },
    },
  });
  return favorites.map((f) => f.product);
}

/** Only admin-approved requests ever leave this function — same rule as the marketplace query. */
export async function getWanted() {
  return prisma.wantedListing.findMany({
    where: { status: 'OPEN', moderation: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { buyer: true },
  });
}

/** A buyer's own requests, regardless of moderation status — for their status view. */
export async function getMyWanted(userId: string) {
  return prisma.wantedListing.findMany({
    where: { buyer: { userId } },
    orderBy: { createdAt: 'desc' },
  });
}
