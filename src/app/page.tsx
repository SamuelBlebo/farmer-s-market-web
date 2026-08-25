import { Suspense } from 'react';
import Link from 'next/link';
import { CategoryChips, Filters } from '@/components/filters';
import { Pagination } from '@/components/pagination';
import { ProductCard } from '@/components/product-card';
import { SearchBar } from '@/components/search-bar';
import { getCategories, getMarketProducts, getMarketStats, type MarketFilters } from '@/server/queries';
import { currentUser } from '@/server/authz';

export default async function MarketplacePage({ searchParams }: { searchParams: MarketFilters }) {
  const [user, { items, total, page, pages }, categories, stats] = await Promise.all([
    currentUser(),
    getMarketProducts(searchParams),
    getCategories(),
    getMarketStats(),
  ]);

  const hasFilters = Boolean(
    searchParams.q || searchParams.category || searchParams.region || searchParams.min || searchParams.max || searchParams.verified,
  );

  return (
    <>
      {!user && (
        <section className="card mb-5 overflow-hidden p-6 sm:p-8">
          <p className="eyebrow">Ghana&apos;s produce marketplace</p>
          <h1 className="mt-1 max-w-[520px] text-[26px] font-extrabold leading-tight tracking-tight sm:text-3xl">
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
              <h2 className="text-lg font-extrabold tracking-tight">
                {categories.find((c) => c.slug === searchParams.category)?.name ?? 'All produce'}
              </h2>
              <span className="text-[13.5px] text-muted">{total} listings</span>
            </div>

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
