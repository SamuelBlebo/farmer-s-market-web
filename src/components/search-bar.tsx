'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { REGIONS } from '@/lib/constants';
import { formatPrice } from '@/lib/format';
import { trackClient } from '@/lib/analytics-client';
import { CategoryIcon } from './category-icon';
import { BadgeCheckIcon, SearchIcon, UserIcon } from './icons';

type ProductSuggestion = {
  kind: 'product';
  id: string;
  name: string;
  unit: string;
  priceMinor: number;
  image: string | null;
  category: { name: string; slug: string };
};
type FarmerSuggestion = { kind: 'farmer'; id: string; farmName: string; region: string; verification: string };
type CategorySuggestion = { kind: 'category'; slug: string; name: string };
type Suggestion = ProductSuggestion | FarmerSuggestion | CategorySuggestion;

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

function suggestionKey(s: Suggestion): string {
  return s.kind === 'category' ? `category:${s.slug}` : `${s.kind}:${s.id}`;
}

function suggestionHref(s: Suggestion): string {
  if (s.kind === 'product') return `/products/${s.id}`;
  if (s.kind === 'farmer') return `/farmers/${s.id}`;
  return `/?category=${s.slug}`;
}

export function SearchBar({ variant = 'page' }: { variant?: 'page' | 'header' }) {
  const header = variant === 'header';
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = q.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((data: { products: Omit<ProductSuggestion, 'kind'>[]; farmers: Omit<FarmerSuggestion, 'kind'>[]; categories: Omit<CategorySuggestion, 'kind'>[] }) => {
          const combined: Suggestion[] = [
            ...(data.categories ?? []).map((c) => ({ kind: 'category' as const, ...c })),
            ...(data.farmers ?? []).map((f) => ({ kind: 'farmer' as const, ...f })),
            ...(data.products ?? []).map((p) => ({ kind: 'product' as const, ...p })),
          ];
          setSuggestions(combined);
          setOpen(true);
          setHighlight(-1);
        })
        .catch(() => {});
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function submit(formData: FormData) {
    const next = new URLSearchParams(params.toString());
    const query = String(formData.get('q') ?? '').trim();
    const region = String(formData.get('region') ?? '');
    query ? next.set('q', query) : next.delete('q');
    region ? next.set('region', region) : next.delete('region');
    next.delete('page');
    setOpen(false);
    if (query) trackClient('SEARCH_PERFORMED', undefined, query);
    router.push(`/?${next.toString()}`);
  }

  function selectSuggestion(s: Suggestion) {
    setOpen(false);
    router.push(suggestionHref(s));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <form action={submit} className={header ? 'relative w-full' : 'mb-3 flex flex-col gap-2 sm:flex-row'}>
      <div ref={boxRef} className="relative flex-1">
        {header && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <SearchIcon className="h-4 w-4" />
          </span>
        )}
        <input
          name="q"
          className={`input w-full ${header ? 'pl-9' : ''}`}
          placeholder="Search produce, farms, categories…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="search-suggestions"
        />

        {open && suggestions.length > 0 && (
          <ul
            id="search-suggestions"
            role="listbox"
            className={`absolute left-0 right-0 top-full mt-1 max-h-80 overflow-y-auto rounded-[10px] border border-line bg-white shadow-md ${header ? 'z-40' : 'z-30'}`}
          >
            {suggestions.map((s, i) => (
              <li key={suggestionKey(s)} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(s)}
                  onMouseEnter={() => setHighlight(i)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left ${i === highlight ? 'bg-paper' : ''}`}
                >
                  <div className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-leaf-light text-leaf-dark">
                    {s.kind === 'product' && s.image ? (
                      <Image src={s.image} alt="" fill sizes="36px" className="object-cover" />
                    ) : s.kind === 'product' ? (
                      <CategoryIcon slug={s.category.slug} className="h-4 w-4" />
                    ) : s.kind === 'farmer' ? (
                      <UserIcon className="h-4 w-4" />
                    ) : (
                      <CategoryIcon slug={s.slug} className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {s.kind === 'product' && (
                      <>
                        <div className="truncate text-sm font-semibold">{s.name}</div>
                        <div className="truncate text-[12px] text-muted">{s.category.name}</div>
                      </>
                    )}
                    {s.kind === 'farmer' && (
                      <>
                        <div className="truncate text-sm font-semibold">{s.farmName}</div>
                        <div className="truncate text-[12px] text-muted">Farm · {s.region}</div>
                      </>
                    )}
                    {s.kind === 'category' && (
                      <>
                        <div className="truncate text-sm font-semibold">{s.name}</div>
                        <div className="truncate text-[12px] text-muted">Category</div>
                      </>
                    )}
                  </div>
                  {s.kind === 'product' && (
                    <div className="shrink-0 text-[12.5px] font-bold">
                      {formatPrice(s.priceMinor)}<span className="font-normal text-muted">/{s.unit}</span>
                    </div>
                  )}
                  {s.kind === 'farmer' && s.verification === 'VERIFIED' && (
                    <span className="badge shrink-0 bg-leaf-light text-leaf-dark">
                      <BadgeCheckIcon className="h-3 w-3" />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!header && (
        <>
          <select name="region" className="input sm:w-52" defaultValue={params.get('region') ?? ''}>
            <option value="">All of Ghana</option>
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          <button className="btn">Search</button>
        </>
      )}
    </form>
  );
}
