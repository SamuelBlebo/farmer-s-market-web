'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { REGIONS } from '@/lib/constants';
import { formatPrice } from '@/lib/format';

type Suggestion = {
  id: string;
  name: string;
  unit: string;
  priceMinor: number;
  image: string | null;
  category: { name: string; emoji: string | null };
};

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

export function SearchBar() {
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
        .then((data: { items: Suggestion[] }) => {
          setSuggestions(data.items ?? []);
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
    router.push(`/?${next.toString()}`);
  }

  function selectSuggestion(s: Suggestion) {
    setOpen(false);
    router.push(`/products/${s.id}`);
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
    <form action={submit} className="mb-3 flex flex-col gap-2 sm:flex-row">
      <div ref={boxRef} className="relative flex-1">
        <input
          name="q"
          className="input w-full"
          placeholder="Search produce — tomatoes, maize, yam…"
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
            className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-[10px] border border-line bg-white shadow-md"
          >
            {suggestions.map((s, i) => (
              <li key={s.id} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(s)}
                  onMouseEnter={() => setHighlight(i)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left ${i === highlight ? 'bg-paper' : ''}`}
                >
                  <div className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-leaf-light text-lg">
                    {s.image ? (
                      <Image src={s.image} alt="" fill sizes="36px" className="object-cover" />
                    ) : (
                      <span aria-hidden>{s.category.emoji ?? '🌿'}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{s.name}</div>
                    <div className="truncate text-[12px] text-muted">{s.category.name}</div>
                  </div>
                  <div className="shrink-0 text-[12.5px] font-bold">
                    {formatPrice(s.priceMinor)}<span className="font-normal text-muted">/{s.unit}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <select name="region" className="input sm:w-52" defaultValue={params.get('region') ?? ''}>
        <option value="">All of Ghana</option>
        {REGIONS.map((r) => <option key={r}>{r}</option>)}
      </select>
      <button className="btn">Search</button>
    </form>
  );
}
