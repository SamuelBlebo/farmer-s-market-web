'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from './toast-provider';

/**
 * Drop-in replacement for the old inline ActionBanner — same `?key=1`
 * one-shot redirect-flag contract, but surfaces the message as a toast and
 * strips the flag from the URL afterward instead of rendering an inline banner.
 */
export function ToastListener({ messages }: { messages: Record<string, string> }) {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const paramsKey = params.toString();

  useEffect(() => {
    const key = Object.keys(messages).find((k) => params.get(k) === '1');
    if (!key) return;
    toast.success(messages[key]);
    const next = new URLSearchParams(params.toString());
    next.delete(key);
    router.replace(next.toString() ? `?${next.toString()}` : '?', { scroll: false });
    // Re-run only when the URL's query actually changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return null;
}
