'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { REGIONS, SORTS } from '@/lib/constants';

/** Filters write to the URL — every marketplace view is shareable and cacheable. */
export function Filters({ categories }: { categories: { slug: string; name: string }[] }) {
  const router = useRouter();
  const params = useSearchParams();

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    router.push(`/?${next.toString()}`);
  }

  return (
    <aside className="card sticky top-4 hidden p-4 md:block">
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
    </aside>
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
    `whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-semibold ${
      on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-muted'
    }`;

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      <button onClick={() => pick('')} className={chip(!active)}>All</button>
      {categories.map((c) => (
        <button key={c.slug} onClick={() => pick(c.slug)} className={chip(active === c.slug)}>
          {c.emoji} {c.name}
        </button>
      ))}
    </div>
  );
}
