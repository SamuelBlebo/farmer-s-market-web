'use client';

import Link from 'next/link';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-[440px] p-10 text-center">
      <div className="text-4xl" aria-hidden>⚠️</div>
      <p className="mt-2 font-bold">Something went wrong.</p>
      <p className="mt-1 text-sm text-muted">
        That didn&apos;t work — often a permissions issue or a dropped connection. Try again.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <button onClick={reset} className="btn">Try again</button>
        <Link href="/" className="btn-ghost">Back to marketplace</Link>
      </div>
    </div>
  );
}
