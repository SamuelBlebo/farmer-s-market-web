'use client';

import { useEffect, useState } from 'react';
import { ChevronDownIcon } from './icons';

export type DashboardSection = {
  id: string;
  title: string;
  /** Stays visible even when the section is collapsed — e.g. an "Add farmer" quick-action link. */
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
};

const ORDER_KEY = 'admin-dashboard-order';
const COLLAPSED_KEY = 'admin-dashboard-collapsed';

function readStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing / storage disabled — the page still works, it just won't remember the layout next time.
  }
}

/**
 * Per-admin, per-browser layout preference — collapse noisy sections and
 * reorder them with the up/down arrows. Both persist to localStorage, not
 * the database: this is a personal viewing preference, not shared platform
 * state, and every section still renders (just possibly collapsed or moved)
 * so nothing here can hide real data from a different admin.
 */
export function DashboardSections({ sections }: { sections: DashboardSection[] }) {
  const defaultOrder = sections.map((s) => s.id);
  const [order, setOrder] = useState<string[]>(defaultOrder);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedOrder = readStorage<string[]>(ORDER_KEY);
    if (storedOrder) {
      // Keep only sections that still exist, then append any new ones the
      // stored order predates — so a code change adding/removing a section
      // doesn't drop it from view or crash on an unknown id.
      const known = new Set(storedOrder);
      setOrder([...storedOrder.filter((id) => defaultOrder.includes(id)), ...defaultOrder.filter((id) => !known.has(id))]);
    }

    const storedCollapsed = readStorage<Record<string, boolean>>(COLLAPSED_KEY);
    let initialCollapsed = storedCollapsed ?? {};

    // A link elsewhere in the app (e.g. a stat card, a notification, an
    // edit page's "back") points at a section by #id — if that section was
    // left collapsed from a previous visit, expand it so the link actually
    // lands somewhere visible.
    const hash = window.location.hash.replace('#', '');
    if (hash && defaultOrder.includes(hash) && initialCollapsed[hash]) {
      initialCollapsed = { ...initialCollapsed, [hash]: false };
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: 'start' }));
    }
    setCollapsed(initialCollapsed);

    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(ORDER_KEY, order);
  }, [order, hydrated]);

  useEffect(() => {
    if (hydrated) writeStorage(COLLAPSED_KEY, collapsed);
  }, [collapsed, hydrated]);

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function move(id: string, direction: -1 | 1) {
    setOrder((prev) => {
      const index = prev.indexOf(id);
      const swapWith = index + direction;
      if (swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next;
    });
  }

  const byId = new Map(sections.map((s) => [s.id, s]));

  return (
    <div className="space-y-6">
      {order.map((id, i) => {
        const section = byId.get(id);
        if (!section) return null;
        const isCollapsed = collapsed[id] ?? false;

        return (
          <div key={id} id={id} className="scroll-mt-4">
            <div className="mb-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => toggleCollapsed(id)}
                aria-expanded={!isCollapsed}
                className="inline-flex items-center gap-1.5 rounded-[8px] py-0.5 pr-1 text-lg font-semibold tracking-tight transition-colors hover:text-leaf-dark"
              >
                <ChevronDownIcon className={`h-4 w-4 shrink-0 text-muted transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                {section.title}
              </button>
              <div className="ml-auto flex items-center gap-1">
                {section.headerExtra}
                <button
                  type="button"
                  onClick={() => move(id, -1)}
                  disabled={i === 0}
                  aria-label={`Move ${section.title} up`}
                  className="rounded-full p-1.5 text-muted transition-colors hover:bg-paper hover:text-ink disabled:opacity-30"
                >
                  <ChevronDownIcon className="h-4 w-4 rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => move(id, 1)}
                  disabled={i === order.length - 1}
                  aria-label={`Move ${section.title} down`}
                  className="rounded-full p-1.5 text-muted transition-colors hover:bg-paper hover:text-ink disabled:opacity-30"
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            {!isCollapsed && section.children}
          </div>
        );
      })}
    </div>
  );
}
