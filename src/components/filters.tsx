'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoryIcon } from './category-icon';
import { CloseIcon, FilterIcon } from './icons';
import { REGIONS, SORTS } from '@/lib/constants';

const ACTIVE_FILTER_KEYS = ['min', 'max', 'region', 'category', 'verified'] as const;

function FilterFields({
  categories,
  params,
  set,
}: {
  categories: { slug: string; name: string }[];
  params: URLSearchParams;
  set: (key: string, value: string) => void;
}) {
  return (
    <>
      <h4 className="eyebrow mb-2">Price per unit (GH¢)</h4>
      <div className="grid grid-cols-2 gap-2">
        <input
          className="input"
          inputMode="numeric"
          placeholder="Min"
          defaultValue={params.get('min') ?? ''}
          onBlur={(e) => set('min', e.target.value)}
        />
        <input
          className="input"
          inputMode="numeric"
          placeholder="Max"
          defaultValue={params.get('max') ?? ''}
          onBlur={(e) => set('max', e.target.value)}
        />
      </div>

      <h4 className="eyebrow mb-2 mt-4">Region</h4>
      <select className="input" value={params.get('region') ?? ''} onChange={(e) => set('region', e.target.value)}>
        <option value="">All of Ghana</option>
        {REGIONS.map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>

      <h4 className="eyebrow mb-2 mt-4">Category</h4>
      <select className="input" value={params.get('category') ?? ''} onChange={(e) => set('category', e.target.value)}>
        <option value="">All produce</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>{c.name}</option>
        ))}
      </select>

      <h4 className="eyebrow mb-2 mt-4">Farmer</h4>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={params.get('verified') === '1'}
          onChange={(e) => set('verified', e.target.checked ? '1' : '')}
        />
        Verified only
      </label>

      <h4 className="eyebrow mb-2 mt-4">Sort</h4>
      <select className="input" value={params.get('sort') ?? 'newest'} onChange={(e) => set('sort', e.target.value)}>
        {Object.entries(SORTS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
    </>
  );
}

/** Filters write to the URL — every marketplace view is shareable and cacheable. A sticky sidebar on desktop; a single icon that opens a bottom sheet on mobile, where the full form doesn't fit. */
export function Filters({ categories }: { categories: { slug: string; name: string }[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    router.push(`/?${next.toString()}`);
  }

  const activeCount = ACTIVE_FILTER_KEYS.filter((k) => params.get(k)).length;

  return (
    <>
      <aside className="card mb-4 hidden p-4 md:sticky md:top-4 md:mb-0 md:block">
        <FilterFields categories={categories} params={params} set={set} />
      </aside>

      <div className="mb-3 flex justify-end md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={activeCount > 0 ? `Filters — ${activeCount} active` : 'Filters'}
          className="relative grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-ink transition-colors hover:bg-paper"
        >
          <FilterIcon className="h-4 w-4" />
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-clay px-1 text-[10px] font-bold leading-none text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 md:hidden" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-label="Filters"
            className="card max-h-[85vh] w-full overflow-y-auto rounded-b-none rounded-t-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[15px] font-bold">Filters</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="rounded-full p-1.5 text-muted transition-colors hover:bg-paper"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <FilterFields categories={categories} params={params} set={set} />
            <button type="button" onClick={() => setOpen(false)} className="btn mt-4 w-full">Show results</button>
          </div>
        </div>
      )}
    </>
  );
}

export function CategoryChips({ categories }: { categories: { slug: string; name: string; emoji: string | null }[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get('category') ?? '';

  function pick(slug: string) {
    const next = new URLSearchParams(params.toString());
    if (slug) next.set('category', slug);
    else next.delete('category');
    next.delete('page');
    router.push(`/?${next.toString()}`);
  }

  const chip = (on: boolean) =>
    `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-semibold ${
      on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-muted'
    }`;

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      <button type="button" onClick={() => pick('')} aria-current={!active ? 'true' : undefined} className={chip(!active)}>
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.slug}
          type="button"
          onClick={() => pick(c.slug)}
          aria-current={active === c.slug ? 'true' : undefined}
          className={chip(active === c.slug)}
        >
          <CategoryIcon slug={c.slug} className="h-3.5 w-3.5" /> {c.name}
        </button>
      ))}
    </div>
  );
}
