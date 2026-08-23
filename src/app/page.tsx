import { Suspense } from 'react';
import { CategoryChips, Filters } from '@/components/filters';
import { ProductCard } from '@/components/product-card';
import { SearchBar } from '@/components/search-bar';
import { getCategories, getMarketProducts, type MarketFilters } from '@/server/queries';

export default async function MarketplacePage({ searchParams }: { searchParams: MarketFilters }) {
  const [{ items, total, page, pages }, categories] = await Promise.all([
    getMarketProducts(searchParams),
    getCategories(),
  ]);

  return (
    <>
      <Suspense>
        <SearchBar />
        <CategoryChips categories={categories} />
      </Suspense>

      <div className="grid items-start gap-5 md:grid-cols-[230px_1fr]">
        <Suspense>
          <Filters categories={categories} />
        </Suspense>

        <div>
          <div className="mb-3 flex items-baseline gap-2.5">
            <h1 className="text-lg font-extrabold tracking-tight">
              {categories.find((c) => c.slug === searchParams.category)?.name ?? 'All produce'}
            </h1>
            <span className="text-[13.5px] text-muted">{total} listings</span>
          </div>

          {items.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="font-bold">Nothing matches that yet.</p>
              <p className="mt-1 text-sm text-muted">
                Try a wider region, or clear the filters to see everything on the market.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <p className="mt-6 text-center text-sm text-muted">
              Page {page} of {pages}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
