import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

// Regenerated at most once an hour — a sitemap doesn't need to be second-fresh.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, farmers, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'ACTIVE', moderation: 'APPROVED' },
      select: { id: true, updatedAt: true },
    }),
    // Only farmers with at least one publicly visible listing — an empty
    // storefront isn't worth a search engine's crawl budget.
    prisma.farmerProfile.findMany({
      where: { products: { some: { status: 'ACTIVE', moderation: 'APPROVED' } } },
      select: { id: true, updatedAt: true },
    }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/wanted`, changeFrequency: 'hourly', priority: 0.7 },
  ];

  // Categories are a marketplace filter, not their own route — this indexes
  // the same URLs the category chips on the homepage actually link to.
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/?category=${c.slug}`,
    changeFrequency: 'daily',
    priority: 0.6,
  }));

  const farmerRoutes: MetadataRoute.Sitemap = farmers.map((f) => ({
    url: `${SITE_URL}/farmers/${f.id}`,
    lastModified: f.updatedAt,
    changeFrequency: 'daily',
    priority: 0.6,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/products/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: 'daily',
    priority: 0.5,
  }));

  return [...staticRoutes, ...categoryRoutes, ...farmerRoutes, ...productRoutes];
}
