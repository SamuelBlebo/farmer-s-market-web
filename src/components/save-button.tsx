'use client';

import { useState, useTransition } from 'react';
import { toggleFavorite } from '@/server/actions/products';
import { useToast } from './toast-provider';

export function SaveButton({
  productId,
  className = '',
  compact = false,
}: {
  productId: string;
  className?: string;
  compact?: boolean;
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

  return (
    <button type="button" onClick={toggle} disabled={isPending} aria-pressed={saved} className={`btn-ghost ${className}`}>
      <span className={`inline-block transition-transform duration-200 ${pop ? 'scale-125' : 'scale-100'}`} aria-hidden>
        {saved ? '♥' : '♡'}
      </span>{' '}
      {compact ? 'Save' : saved ? 'Saved' : 'Save listing'}
    </button>
  );
}
