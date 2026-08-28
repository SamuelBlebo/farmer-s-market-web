'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { FeedItem } from '@/server/notification-feed';
import { NotificationFeedRow } from './notification-feed-row';
import { BellIcon } from './icons';

type PreviewResponse = { items: (Omit<FeedItem, 'createdAt'> & { createdAt: string })[]; total: number };

/** The bell opens a small dropdown preview in place, instead of navigating away — /notifications is still there for the full list via "View all". */
export function NotificationBellMenu({ count, label }: { count: number; label: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [items, setItems] = useState<FeedItem[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  function load() {
    setStatus('loading');
    fetch('/api/notifications/preview')
      .then((res) => {
        if (!res.ok) throw new Error('failed');
        return res.json();
      })
      .then((data: PreviewResponse) => {
        setItems(data.items.map((item) => ({ ...item, createdAt: new Date(item.createdAt) })));
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && status === 'idle') load();
  }

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={count > 0 ? `${label}: ${count}` : label}
        className="relative hidden h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-paper hover:text-ink sm:grid"
      >
        <BellIcon />
        {count > 0 && (
          <span
            key={count}
            className="animate-badge-bounce absolute right-0.5 top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-clay px-1 text-[10px] font-bold leading-none text-white"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
            <p className="text-sm font-bold">Notifications</p>
            <Link href="/notifications" onClick={() => setOpen(false)} className="text-[12.5px] font-semibold text-leaf-dark hover:underline">
              View all
            </Link>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {status === 'loading' && <p className="p-6 text-center text-sm text-muted">Loading…</p>}
            {status === 'error' && <p className="p-6 text-center text-sm text-muted">Could not load notifications.</p>}
            {status === 'ready' && items.length === 0 && (
              <p className="p-6 text-center text-sm text-muted">You&apos;re all caught up.</p>
            )}
            {status === 'ready' && items.length > 0 && (
              <div className="divide-y divide-line" onClick={() => setOpen(false)}>
                {items.map((item) => <NotificationFeedRow key={item.id} item={item} compact />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
