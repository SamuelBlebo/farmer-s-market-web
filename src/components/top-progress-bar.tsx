'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Next.js App Router has no "navigation started" event to hook into, so
 * route-level loading.tsx skeletons only appear once the new route actually
 * starts streaming — on a fast connection/DB that can be too quick to
 * register, or not show at all for a prefetched route. This starts a bar
 * the instant an in-app link is clicked (before Next.js has even begun the
 * navigation) and clears it once the URL actually changes, so there's
 * always visible feedback that something is happening.
 */
export function TopProgressBar() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const activeRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.('a');
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      if (anchor.origin !== window.location.origin) return;
      if (anchor.pathname === window.location.pathname && anchor.search === window.location.search) return;

      activeRef.current = true;
      setVisible(true);
      setProgress(15);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setProgress((p) => (p >= 85 ? p : p + (85 - p) * 0.15));
      }, 200);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // The URL actually changed — the navigation is done, finish and hide the bar.
  useEffect(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(100);
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]" aria-hidden>
      <div
        className="h-full bg-leaf shadow-[0_0_8px_rgba(19,107,75,0.6)] transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
