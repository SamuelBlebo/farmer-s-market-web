'use client';

import { useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

const SCROLL_STEP = 320;

/** A horizontally-scrolling row with chevron nav buttons instead of a visible scrollbar. */
export function HorizontalScroller({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(delta: number) {
    trackRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollBy(-SCROLL_STEP)}
        aria-label="Scroll left"
        className="absolute left-1 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-line bg-white shadow-md sm:grid"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>

      <div ref={trackRef} className="scrollbar-hide flex scroll-smooth gap-3 overflow-x-auto pb-1">
        {children}
      </div>

      <button
        type="button"
        onClick={() => scrollBy(SCROLL_STEP)}
        aria-label="Scroll right"
        className="absolute right-1 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-line bg-white shadow-md sm:grid"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
