'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const QUICK_FILTERS: { key: 'freshToday' | 'delivery' | 'verified' | 'nearHarvest' | 'featured'; label: string; emoji: string }[] = [
  { key: 'freshToday', label: 'Fresh Today', emoji: '🌿' },
  { key: 'delivery', label: 'Delivery Available', emoji: '🚚' },
  { key: 'verified', label: 'Verified Farmers', emoji: '✓' },
  { key: 'nearHarvest', label: 'Near Harvest', emoji: '🌾' },
  { key: 'featured', label: 'Featured', emoji: '⭐' },
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
            onClick={() => toggle(f.key)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              on ? 'border-leaf bg-leaf-light text-leaf-dark' : 'border-line bg-white text-muted'
            }`}
          >
            {f.emoji} {f.label}
          </button>
        );
      })}
    </div>
  );
}
