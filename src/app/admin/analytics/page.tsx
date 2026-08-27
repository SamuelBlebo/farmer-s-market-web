import type { Metadata } from 'next';
import Link from 'next/link';
import { ActivityChart } from '@/components/activity-chart';
import { DateRangeFilter } from '@/components/date-range-filter';
import { PopularProductsTable } from '@/components/popular-products-table';
import { SectionCard } from '@/components/section-card';
import { StatCard } from '@/components/stat-card';
import { TopFarmersTable } from '@/components/top-farmers-table';
import { ChatIcon, HeartIcon, PhoneIcon, SearchIcon, StoreIcon, UserIcon } from '@/components/icons';
import { resolveDateRange } from '@/lib/date-range';
import { requireAdmin } from '@/server/authz';
import {
  getAnalyticsOverview,
  getDailyActivity,
  getPopularProducts,
  getRegionInsights,
  getTopFarmers,
  getTopSearchTerms,
} from '@/server/admin-analytics';

export const metadata: Metadata = { title: 'Marketplace Analytics' };

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: { range?: string } }) {
  await requireAdmin();

  const since = resolveDateRange(searchParams.range);
  const rangeQuery = searchParams.range ? `?range=${searchParams.range}` : '';

  const [overview, popularProducts, topFarmers, topSearchTerms, dailyActivity, regionInsights] = await Promise.all([
    getAnalyticsOverview(since),
    getPopularProducts(since),
    getTopFarmers(since),
    getTopSearchTerms(since),
    getDailyActivity(7),
    getRegionInsights(since),
  ]);

  return (
    <>
      <p className="eyebrow">Admin</p>
      <h1 className="mb-1 mt-1 text-2xl font-bold tracking-tight">Marketplace Analytics</h1>
      <p className="mb-4 text-[15px] text-muted">Live insights from real buyer activity.</p>

      <DateRangeFilter basePath="/admin/analytics" current={searchParams.range} />

      <div className="mb-5 flex flex-wrap gap-2">
        <Link href={`/api/admin/export/analytics${rangeQuery}`} className="btn-ghost !px-3 !py-1.5 !text-[13px]">
          ⬇ Export Analytics Summary
        </Link>
        <Link href={`/api/admin/export/products${rangeQuery}`} className="btn-ghost !px-3 !py-1.5 !text-[13px]">
          ⬇ Export Products
        </Link>
        <Link href={`/api/admin/export/farmers${rangeQuery}`} className="btn-ghost !px-3 !py-1.5 !text-[13px]">
          ⬇ Export Farmers
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={<StoreIcon />} label="Product Views" value={overview.productViews} />
        <StatCard icon={<UserIcon />} label="Farmer Storefront Views" value={overview.farmerViews} />
        <StatCard icon={<ChatIcon />} label="WhatsApp Clicks" value={overview.whatsappClicks} />
        <StatCard icon={<PhoneIcon />} label="Call Clicks" value={overview.callClicks} />
        <StatCard icon={<SearchIcon />} label="Searches Performed" value={overview.searches} />
        <StatCard icon={<HeartIcon className="h-[18px] w-[18px]" />} label="New Follows" value={overview.newFollows} />
      </div>

      <div className="mb-6">
        <SectionCard title="Activity — Last 7 Days">
          <div className="p-4">
            <ActivityChart data={dailyActivity} />
          </div>
        </SectionCard>
      </div>

      <div className="mb-6">
        <SectionCard title="Popular Products">
          <PopularProductsTable rows={popularProducts} />
        </SectionCard>
      </div>

      <div className="mb-6">
        <SectionCard title="Top Farmers">
          <TopFarmersTable rows={topFarmers} />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Search Insights">
          <div className="p-4">
            {topSearchTerms.length === 0 ? (
              <p className="text-sm text-muted">No searches recorded in this range yet.</p>
            ) : (
              <ol className="space-y-2">
                {topSearchTerms.map((t, i) => (
                  <li key={t.term} className="flex items-center justify-between text-sm">
                    <span className="font-semibold">
                      {i + 1}. {t.term}
                    </span>
                    <span className="font-num font-bold text-muted">{t.count}</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="mt-4 rounded-[10px] bg-paper p-3 text-[12.5px] text-muted">
              <p className="font-semibold text-ink">Zero-result searches: not trackable yet.</p>
              <p className="mt-1">
                SEARCH_PERFORMED is recorded the moment a search is submitted, before the marketplace page loads and
                counts matches — the result count was never captured. Showing a number here would be a guess, not
                data, so this is left undisplayed rather than invented.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Region Insights">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[12px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 font-semibold">Region</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Listings</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {regionInsights.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-5 text-center text-muted">
                      No regional activity yet.
                    </td>
                  </tr>
                ) : (
                  regionInsights.map((r) => (
                    <tr key={r.region}>
                      <td className="px-4 py-3 font-bold">{r.region}</td>
                      <td className="px-4 py-3 text-right font-num font-semibold">{r.listings}</td>
                      <td className="px-4 py-3 text-right font-num font-semibold">{r.views}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
