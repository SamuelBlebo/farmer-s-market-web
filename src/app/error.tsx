'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { WarningIcon } from '@/components/icons';
import { captureException } from '@/lib/monitoring';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureException(error, { digest: error.digest });
  }, [error]);

  return (
    <div className="card mx-auto max-w-[480px] p-8 text-center">
      <WarningIcon className="mx-auto h-8 w-8 text-clay" />
      <h1 className="mt-2 text-xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-1 text-sm text-muted">We&apos;ve logged the issue. Try again, or head back to the marketplace.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2.5">
        <button type="button" onClick={() => reset()} className="btn">Try again</button>
        <Link href="/" className="btn-ghost">Marketplace</Link>
        <Link href="/support" className="btn-ghost">Report this</Link>
      </div>
    </div>
  );
}
