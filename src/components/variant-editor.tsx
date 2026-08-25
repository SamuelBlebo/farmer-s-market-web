'use client';

import { useState } from 'react';

type Row = { key: number; name: string; price: string; quantity: string };
type InitialVariant = { name: string; price: number; quantity?: number | null };

let nextKey = 0;

/**
 * Parallel-array form fields (variantName[]/variantPrice[]/variantQuantity[]
 * via repeated same-name inputs), not JSON-in-a-hidden-input — plain HTML
 * form semantics, zipped back together server-side in readForm().
 */
export function VariantEditor({ initial = [] }: { initial?: InitialVariant[] }) {
  const [rows, setRows] = useState<Row[]>(() =>
    initial.map((v) => ({
      key: nextKey++,
      name: v.name,
      price: String(v.price),
      quantity: v.quantity != null ? String(v.quantity) : '',
    })),
  );

  function add() {
    setRows((prev) => [...prev, { key: nextKey++, name: '', price: '', quantity: '' }]);
  }
  function remove(key: number) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }
  function update(key: number, field: 'name' | 'price' | 'quantity', value: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  return (
    <div>
      {rows.map((r) => (
        <div key={r.key} className="mb-2 grid grid-cols-2 gap-2 rounded-[10px] border border-line p-2.5 sm:grid-cols-[1fr_110px_110px_auto]">
          <label className="col-span-2 block sm:col-span-1">
            <span className="label">Variant name</span>
            <input
              className="input"
              placeholder="e.g. Small"
              value={r.name}
              onChange={(e) => update(r.key, 'name', e.target.value)}
              name="variantName"
            />
          </label>
          <label className="block">
            <span className="label">Price (GH¢)</span>
            <input
              className="input"
              inputMode="decimal"
              value={r.price}
              onChange={(e) => update(r.key, 'price', e.target.value)}
              name="variantPrice"
            />
          </label>
          <label className="block">
            <span className="label">Qty <span className="font-normal text-muted">(optional)</span></span>
            <input
              className="input"
              inputMode="decimal"
              value={r.quantity}
              onChange={(e) => update(r.key, 'quantity', e.target.value)}
              name="variantQuantity"
            />
          </label>
          <button
            type="button"
            onClick={() => remove(r.key)}
            aria-label="Remove variant"
            className="btn-ghost self-end !px-3 !py-2.5"
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="btn-ghost !text-[13px]">+ Add variant</button>
    </div>
  );
}
