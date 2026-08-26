'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'fm_recently_viewed';
const MAX_ITEMS = 10;

/**
 * Guest browsing history — signed-in users get the same 10-item recency
 * window server-side (see recordProductView); this covers the "store
 * locally" requirement for guests without a server round trip.
 */
export function RecordView({ productId }: { productId: string }) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      const next = [productId, ...ids.filter((id) => id !== productId)].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private browsing / storage disabled — silently skip.
    }
  }, [productId]);

  return null;
}
