'use client';

import { useState } from 'react';

const tab = (on: boolean) =>
  `flex-1 rounded-[10px] border px-3 py-2 text-[13px] font-bold ${
    on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-muted'
  }`;

/** Same tab pattern as the email/phone toggle on the login form. */
export function ListingModeTabs({
  quick,
  full,
  initialMode = 'quick',
}: {
  quick: React.ReactNode;
  full: React.ReactNode;
  initialMode?: 'quick' | 'full';
}) {
  const [mode, setMode] = useState<'quick' | 'full'>(initialMode);

  return (
    <div>
      <div className="mb-4 flex gap-2" role="tablist" aria-label="Posting method">
        <button type="button" role="tab" aria-selected={mode === 'quick'} onClick={() => setMode('quick')} className={tab(mode === 'quick')}>
          ⚡ Quick Post
        </button>
        <button type="button" role="tab" aria-selected={mode === 'full'} onClick={() => setMode('full')} className={tab(mode === 'full')}>
          Full listing
        </button>
      </div>
      {mode === 'quick' ? quick : full}
    </div>
  );
}
