'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { CategoryIcon } from './category-icon';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, ZoomIcon } from './icons';
import { SaveButton } from './save-button';

const SWIPE_THRESHOLD = 40;

export function ProductGallery({
  images,
  name,
  categorySlug,
  productId,
}: {
  images: { url: string }[];
  name: string;
  categorySlug: string;
  /** Signed-in users only — omit to skip the save overlay entirely. */
  productId?: string;
}) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const hero = images[active]?.url;

  const go = (delta: number) => {
    if (images.length < 2) return;
    setActive((i) => (i + delta + images.length) % images.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > SWIPE_THRESHOLD) go(delta < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  return (
    <div>
      <div
        className="relative grid h-56 place-items-center overflow-hidden rounded-card bg-gradient-to-br from-[#E9F1E9] to-[#D6E5D8] text-leaf-dark/70 sm:h-72"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {hero ? (
          <>
            <button
              type="button"
              onClick={() => setZoomed(true)}
              className="absolute inset-0"
              aria-label="Zoom photo"
            >
              <Image src={hero} alt={name} fill sizes="(max-width:1024px) 100vw, 640px" className="object-cover object-center" priority />
            </button>
            <span className="pointer-events-none absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white">
              <ZoomIcon />
            </span>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous photo"
                  className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white"
                >
                  <ChevronLeftIcon />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next photo"
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white"
                >
                  <ChevronRightIcon />
                </button>
              </>
            )}
          </>
        ) : (
          <CategoryIcon slug={categorySlug} className="h-16 w-16" />
        )}

        {productId && (
          <div className="absolute right-2 top-2 z-10">
            <SaveButton productId={productId} iconOnly />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-14 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === active ? 'border-leaf' : 'border-transparent'
              }`}
              aria-label={`Show photo ${i + 1}`}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {zoomed && hero && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
          onClick={() => setZoomed(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Close zoom"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"
          >
            <CloseIcon />
          </button>
          <div className="relative h-full max-h-[85vh] w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <Image src={hero} alt={name} fill sizes="100vw" className="object-contain" />
          </div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(1); }}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white"
              >
                <ChevronRightIcon />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
