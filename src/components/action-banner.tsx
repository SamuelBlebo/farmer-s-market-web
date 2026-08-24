'use client';

import { useRouter, useSearchParams } from 'next/navigation';

/** Reads a one-shot `?key=1` redirect flag and shows a dismissible confirmation. */
export function ActionBanner({ messages }: { messages: Record<string, string> }) {
  const router = useRouter();
  const params = useSearchParams();
  const key = Object.keys(messages).find((k) => params.get(k) === '1');
  if (!key) return null;

  function dismiss() {
    const next = new URLSearchParams(params.toString());
    next.delete(key!);
    router.replace(next.toString() ? `?${next.toString()}` : '?', { scroll: false });
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-[10px] border border-leaf bg-leaf-light px-4 py-2.5 text-sm font-semibold text-leaf-dark">
      <span>✓ {messages[key]}</span>
      <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 text-lg leading-none text-leaf-dark">×</button>
    </div>
  );
}
