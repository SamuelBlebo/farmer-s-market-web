'use client';

import { useState, useTransition } from 'react';
import { toggleFavorite } from '@/server/actions/products';
import { HeartIcon } from './icons';
import { useToast } from './toast-provider';

export function SaveButton({
  productId,
  className = '',
  compact = false,
  iconOnly = false,
}: {
  productId: string;
  className?: string;
  compact?: boolean;
  /** A bare circular heart button with a hover tooltip — for overlaying on a photo, not sitting in a button stack. */
  iconOnly?: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const [pop, setPop] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function toggle() {
    const next = !saved;
    setSaved(next);
    setPop(true);
    setTimeout(() => setPop(false), 200);

    startTransition(async () => {
      const formData = new FormData();
      formData.set('productId', productId);
      try {
        await toggleFavorite(formData);
        toast.success(next ? 'Saved to your favorites' : 'Removed from favorites');
      } catch {
        setSaved(!next);
        toast.error('Could not update — try again.');
      }
    });
  }

  if (iconOnly) {
    return (
      <span className="group/save relative inline-flex">
        <button
          type="button"
          onClick={toggle}
          disabled={isPending}
          aria-pressed={saved}
          aria-label={saved ? 'Saved' : 'Save listing'}
          className={`grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-white ${className}`}
        >
          <span className={`inline-block transition-transform duration-200 ${pop ? 'scale-125' : 'scale-100'}`} aria-hidden>
            <HeartIcon className={`h-5 w-5 ${saved ? 'text-clay' : ''}`} filled={saved} />
          </span>
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 whitespace-nowrap rounded-[8px] bg-ink px-2.5 py-1.5 text-[12px] font-medium text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover/save:opacity-100"
        >
          {saved ? 'Saved' : 'Save listing'}
        </span>
      </span>
    );
  }

  return (
    <button type="button" onClick={toggle} disabled={isPending} aria-pressed={saved} className={`btn-ghost ${className}`}>
      <span className={`inline-block transition-transform duration-200 ${pop ? 'scale-125' : 'scale-100'}`} aria-hidden>
        <HeartIcon className="h-4 w-4" filled={saved} />
      </span>
      {compact ? 'Save' : saved ? 'Saved' : 'Save listing'}
    </button>
  );
}
