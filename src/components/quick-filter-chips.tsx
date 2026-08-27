'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { CheckIcon, LeafIcon, StarIcon, TruckIcon, WheatIcon } from './icons';

const QUICK_FILTERS: { key: 'freshToday' | 'delivery' | 'verified' | 'nearHarvest' | 'featured'; label: string; icon: React.ReactNode }[] = [
  { key: 'freshToday', label: 'Fresh Today', icon: <LeafIcon className="h-3.5 w-3.5" /> },
  { key: 'delivery', label: 'Delivery Available', icon: <TruckIcon className="h-3.5 w-3.5" /> },
  { key: 'verified', label: 'Verified Farmers', icon: <CheckIcon className="h-3.5 w-3.5" /> },
  { key: 'nearHarvest', label: 'Near Harvest', icon: <WheatIcon className="h-3.5 w-3.5" /> },
  { key: 'featured', label: 'Featured', icon: <StarIcon className="h-3.5 w-3.5" filled /> },
];

/** Toggle chips over the same MarketFilters params the sidebar Filters/CategoryChips already write to — no separate filtering logic. */
export function QuickFilterChips() {
  const router = useRouter();
  const params = useSearchParams();

  function toggle(key: string) {
    const next = new URLSearchParams(params.toString());
    if (next.get(key) === '1') next.delete(key);
    else next.set(key, '1');
    next.delete('page');
    router.push(`/?${next.toString()}`);
  }

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {QUICK_FILTERS.map((f) => {
        const on = params.get(f.key) === '1';
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => toggle(f.key)}
            aria-pressed={on}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              on ? 'border-leaf bg-leaf-light text-leaf-dark' : 'border-line bg-white text-muted'
            }`}
          >
            {f.icon} {f.label}
          </button>
        );
      })}
    </div>
  );
}
