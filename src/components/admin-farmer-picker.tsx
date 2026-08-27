'use client';

import { useRouter } from 'next/navigation';

type Farmer = { id: string; farmName: string; town: string; region: string; phone: string };

/** Picking a farmer navigates to ?farmerId=... so the server component below re-renders bound to them. */
export function AdminFarmerPicker({ farmers, selectedId }: { farmers: Farmer[]; selectedId?: string }) {
  const router = useRouter();

  return (
    <label className="mb-4 block">
      <span className="label">Post for which farmer?</span>
      <select
        className="input"
        defaultValue={selectedId ?? ''}
        onChange={(e) => router.push(e.target.value ? `/admin/listings/new?farmerId=${e.target.value}` : '/admin/listings/new')}
      >
        <option value="">Select a farmer…</option>
        {farmers.map((f) => (
          <option key={f.id} value={f.id}>{f.farmName} — {f.town}, {f.region} — {f.phone}</option>
        ))}
      </select>
    </label>
  );
}
