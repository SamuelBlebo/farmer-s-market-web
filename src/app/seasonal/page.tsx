import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ProductCard } from '@/components/product-card';
import { getSeasonalHub } from '@/server/queries';

export const metadata: Metadata = {
  title: 'Seasonal Produce',
  description: 'What’s ready now, what’s harvesting this week, and what’s coming soon across Ghana’s farms.',
};

const SECTIONS = [
  { key: 'readyNow', title: '🟢 Ready Now', empty: 'Nothing marked ready right now — check back soon.' },
  { key: 'harvestingThisWeek', title: '🌾 Harvesting This Week', empty: 'No harvests scheduled this week yet.' },
  { key: 'comingSoon', title: '📅 Coming Soon', empty: 'No upcoming harvests scheduled yet.' },
] as const;

export default async function SeasonalPage() {
  const hub = await getSeasonalHub();

  return (
    <>
      <Breadcrumbs items={[{ label: 'Marketplace', href: '/' }, { label: 'Seasonal Produce' }]} />

      <p className="eyebrow">Discover</p>
      <h1 className="mb-1 mt-1 text-2xl font-bold tracking-tight">Seasonal Produce Hub</h1>
      <p className="mb-6 text-[15px] text-muted">
        What&apos;s ready now, what&apos;s harvesting this week, and what&apos;s coming soon — grouped by real harvest dates.
      </p>

      {SECTIONS.map((section) => {
        const items = hub[section.key];
        return (
          <div key={section.key} className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
              <span className="text-[12.5px] text-muted">{items.length}</span>
            </div>
            {items.length === 0 ? (
              <div className="card p-6 text-center">
                <p className="text-sm text-muted">{section.empty}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {items.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
