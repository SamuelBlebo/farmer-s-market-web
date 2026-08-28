'use client';

import { useState } from 'react';
import { DocumentIcon, GridIcon } from './icons';

/** Toggles between two already-rendered representations of the same data — both come from the server, this just swaps which one shows. */
export function ListCardToggle({ list, cards }: { list: React.ReactNode; cards: React.ReactNode }) {
  const [view, setView] = useState<'list' | 'cards'>('list');

  return (
    <div>
      <div className="mb-2 inline-flex rounded-[10px] border border-line p-0.5">
        <button
          type="button"
          onClick={() => setView('list')}
          aria-pressed={view === 'list'}
          className={`inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[12.5px] font-semibold transition-colors ${
            view === 'list' ? 'bg-leaf text-white' : 'text-muted hover:bg-paper'
          }`}
        >
          <DocumentIcon className="h-3.5 w-3.5" /> List
        </button>
        <button
          type="button"
          onClick={() => setView('cards')}
          aria-pressed={view === 'cards'}
          className={`inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[12.5px] font-semibold transition-colors ${
            view === 'cards' ? 'bg-leaf text-white' : 'text-muted hover:bg-paper'
          }`}
        >
          <GridIcon className="h-3.5 w-3.5" /> Cards
        </button>
      </div>
      {view === 'list' ? list : cards}
    </div>
  );
}
