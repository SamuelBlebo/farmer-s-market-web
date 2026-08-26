'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrustScoreBadge } from './trust-score-badge';

type Row = { id: string; farmName: string; followers: number; storefrontViews: number; activeListings: number; trustScore: number };
type SortKey = 'followers' | 'storefrontViews' | 'activeListings' | 'trustScore';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'followers', label: 'Followers' },
  { key: 'storefrontViews', label: 'Storefront Views' },
  { key: 'activeListings', label: 'Active Listings' },
  { key: 'trustScore', label: 'Trust Score' },
];

export function TopFarmersTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>('storefrontViews');
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
    return <p className="p-5 text-sm text-muted">No farmer storefront activity in this range yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-[12px] uppercase tracking-wide text-muted">
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
          {sorted.map((f) => (
            <tr
              key={f.id}
              onClick={() => router.push(`/farmers/${f.id}`)}
              className="cursor-pointer transition-colors hover:bg-paper"
            >
              <td className="px-4 py-3 font-bold">{f.farmName}</td>
              <td className="px-4 py-3 text-right font-num font-semibold">{f.followers}</td>
              <td className="px-4 py-3 text-right font-num font-semibold">{f.storefrontViews}</td>
              <td className="px-4 py-3 text-right font-num font-semibold">{f.activeListings}</td>
              <td className="px-4 py-3 text-right">
                <TrustScoreBadge score={f.trustScore} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
