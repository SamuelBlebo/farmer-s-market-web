import { Suspense } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { CategoryChips, Filters } from '@/components/filters';
import { Pagination } from '@/components/pagination';
import { ProductCard } from '@/components/product-card';
import { SearchBar } from '@/components/search-bar';
import {
  getCategories,
  getFeaturedProducts,
  getFollowedFarmsProducts,
  getMarketProducts,
  getMarketStats,
  type MarketFilters,
} from '@/server/queries';
import { notifyNewlyAvailableHarvests } from '@/server/notifications';
import { currentUser } from '@/server/authz';

/** Builds a "remove just this filter" URL by dropping the given keys from the current search params. */
function withoutParams(searchParams: MarketFilters, keys: (keyof MarketFilters)[]): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams) as [keyof MarketFilters, string | undefined][]) {
    if (keys.includes(key) || key === 'page' || value === undefined) continue;
    next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `/?${qs}` : '/';
}

export default async function MarketplacePage({ searchParams }: { searchParams: MarketFilters }) {
  const user = await currentUser();

  const [{ items, total, page, pages }, categories, stats, featured, followedProducts] = await Promise.all([
    getMarketProducts(searchParams),
    getCategories(),
    getMarketStats(),
    getFeaturedProducts(),
    user?.role === 'BUYER' ? getFollowedFarmsProducts(user.id) : Promise.resolve([]),
    notifyNewlyAvailableHarvests(),
  ]);

  const hasFilters = Boolean(
    searchParams.q || searchParams.category || searchParams.region || searchParams.min || searchParams.max || searchParams.verified,
  );

  const activeCategory = categories.find((c) => c.slug === searchParams.category);

  const chips: { label: string; href: string }[] = [];
  if (searchParams.q) chips.push({ label: `"${searchParams.q}"`, href: withoutParams(searchParams, ['q']) });
  if (activeCategory) chips.push({ label: activeCategory.name, href: withoutParams(searchParams, ['category']) });
  if (searchParams.region) chips.push({ label: searchParams.region, href: withoutParams(searchParams, ['region']) });
  if (searchParams.verified === '1') chips.push({ label: 'Verified', href: withoutParams(searchParams, ['verified']) });
  if (searchParams.min || searchParams.max) {
    chips.push({
      label: `GH¢${searchParams.min ?? '0'}–${searchParams.max ?? '∞'}`,
      href: withoutParams(searchParams, ['min', 'max']),
    });
  }

  return (
    <>
      {activeCategory && (
        <Breadcrumbs items={[{ label: 'Marketplace', href: '/' }, { label: activeCategory.name }]} />
      )}

      {!user && (
        <section className="card mb-5 overflow-hidden p-6 sm:p-8">
          <p className="eyebrow">Ghana&apos;s produce marketplace</p>
          <h1 className="mt-1 max-w-[520px] text-[26px] font-bold leading-tight tracking-tight sm:text-3xl">
            Fresh from the farm. No middlemen, no fees.
          </h1>
          <p className="mt-2 max-w-[480px] text-[15px] text-muted">
            Farmers list what they have. Buyers browse, filter by region, and message the farmer directly on WhatsApp.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <a href="#listings" className="btn">Browse produce</a>
            <Link href="/register" className="btn-ghost">Sell on Farmers Market</Link>
          </div>
          <p className="mt-4 text-[12.5px] font-semibold text-muted">
            🌾 {stats.listings} listings live · ✓ {stats.verifiedFarmers} verified farmers · 📍 {stats.regionCount} regions across Ghana
          </p>
        </section>
      )}

      {featured.length > 0 && !hasFilters && (
        <div className="mb-5">
          <h2 className="eyebrow mb-2">⭐ Featured Today</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}

      {followedProducts.length > 0 && !hasFilters && (
        <div className="mb-5">
          <h2 className="eyebrow mb-2">🌱 From Farmers You Follow</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {followedProducts.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}

      <h2 className="eyebrow mb-2">Browse by category</h2>
      <Suspense>
        <CategoryChips categories={categories} />
      </Suspense>

      <div id="listings" className="scroll-mt-4">
        <Suspense>
          <SearchBar />
        </Suspense>

        <div className="grid items-start gap-5 md:grid-cols-[230px_1fr]">
          <Suspense>
            <Filters categories={categories} />
          </Suspense>

          <div>
            <div className="mb-3 flex items-baseline gap-2.5">
              <h2 className="text-lg font-semibold tracking-tight">
                {activeCategory?.name ?? 'All produce'}
              </h2>
              <span className="text-[13.5px] text-muted">{total} listings</span>
            </div>

            {chips.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {chips.map((c) => (
                  <Link
                    key={c.label}
                    href={c.href}
                    className="badge inline-flex items-center gap-1 bg-paper text-ink transition-colors hover:bg-line"
                  >
                    {c.label} <span aria-hidden>×</span>
                  </Link>
                ))}
                <Link href="/" className="text-[12.5px] font-bold text-leaf-dark hover:underline">Clear All</Link>
              </div>
            )}

            {items.length === 0 ? (
              <div className="card p-10 text-center">
                <p className="font-bold">
                  {hasFilters ? 'Nothing matches that search.' : 'No produce listed yet.'}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {hasFilters
                    ? 'Try a wider region, a different category, or clear the filters to see everything on the market.'
                    : 'Check back soon, or be the first to post something.'}
                </p>
                {hasFilters ? (
                  <Link href="/" className="btn-ghost mt-4">Clear all filters</Link>
                ) : (
                  <Link href="/register" className="btn mt-4">Join as a farmer</Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {items.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            )}

            <Pagination page={page} pages={pages} basePath="/" searchParams={searchParams} />
          </div>
        </div>
      </div>
    </>
  );
}
