'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Row = { id: string; name: string; farmName: string; views: number; whatsapp: number; calls: number };
type SortKey = 'views' | 'whatsapp' | 'calls';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'views', label: 'Views' },
  { key: 'whatsapp', label: 'WhatsApp Clicks' },
  { key: 'calls', label: 'Call Clicks' },
];

/** Sorts the already-fetched rows in the browser — the data is small and fully loaded, so no server round trip is needed to re-sort it. */
export function PopularProductsTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>('views');
  const [desc, setDesc] = useState(true);

  const sorted = [...rows].sort((a, b) => (desc ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]));

  function toggleSort(key: SortKey) {
    if (key === sortKey) setDesc((d) => !d);
    else {
      setSortKey(key);
      setDesc(true);
    }
  }

  if (rows.length === 0) {
    return <p className="p-5 text-sm text-muted">No product activity in this range yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-[12px] uppercase tracking-wide text-muted">
            <th className="px-4 py-2.5 font-semibold">Product</th>
            <th className="px-4 py-2.5 font-semibold">Farmer</th>
            {COLUMNS.map((c) => (
              <th key={c.key} className="px-4 py-2.5 text-right font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort(c.key)}
                  className="inline-flex items-center gap-1 uppercase tracking-wide text-muted hover:text-ink"
                >
                  {c.label} {sortKey === c.key && (desc ? '↓' : '↑')}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sorted.map((p) => (
            <tr
              key={p.id}
              onClick={() => router.push(`/products/${p.id}`)}
              className="cursor-pointer transition-colors hover:bg-paper"
            >
              <td className="px-4 py-3 font-bold">{p.name}</td>
              <td className="px-4 py-3 text-muted">{p.farmName}</td>
              <td className="px-4 py-3 text-right font-num font-semibold">{p.views}</td>
              <td className="px-4 py-3 text-right font-num font-semibold">{p.whatsapp}</td>
              <td className="px-4 py-3 text-right font-num font-semibold">{p.calls}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
