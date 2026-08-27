'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import Link from 'next/link';
import { ImageUploader } from './image-uploader';
import { PinIcon } from './icons';
import { SubmitButton } from './submit-button';
import { VariantEditor } from './variant-editor';
import { UNITS } from '@/lib/constants';
import type { ActionState } from '@/server/actions/products';

type Category = { id: string; name: string };
type Initial = {
  name?: string;
  categoryId?: string;
  price?: number;
  unit?: string;
  quantity?: string;
  region?: string;
  town?: string;
  description?: string | null;
  images?: { url: string; publicId: string }[];
  expectedHarvestDate?: string;
  variants?: { name: string; price: number; quantity?: number | null }[];
  deliveryAvailable?: boolean;
  deliveryPaidBy?: 'FARMER' | 'BUYER' | null;
};

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function ProductForm({
  action,
  categories,
  initial,
  submitLabel,
  locationNote,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  categories: Category[];
  initial?: Initial;
  submitLabel: string;
  /** Overrides the "update it in your profile" copy — for the admin post-on-behalf-of form, where that link doesn't apply. */
  locationNote?: React.ReactNode;
}) {
  const [state, formAction] = useFormState(action, {} as ActionState);
  const err = (f: string) => state.fieldErrors?.[f]?.[0];
  const [deliveryAvailable, setDeliveryAvailable] = useState(initial?.deliveryAvailable ?? false);

  const today = new Date();
  const max = new Date();
  max.setDate(today.getDate() + 30);

  return (
    <form action={formAction} className="card p-5">
      <label className="mb-3.5 block">
        <span className="label">What are you selling?</span>
        <input name="name" className="input" defaultValue={initial?.name} placeholder="e.g. Fresh Tomatoes" required />
        {err('name') && <p className="mt-1 text-sm text-clay">{err('name')}</p>}
      </label>

      <label className="mb-3.5 block">
        <span className="label">Category</span>
        <select name="categoryId" className="input" defaultValue={initial?.categoryId} required>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>

      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Price (GH¢)</span>
          <input name="price" inputMode="decimal" className="input" defaultValue={initial?.price} required />
          {err('price') && <p className="mt-1 text-sm text-clay">{err('price')}</p>}
        </label>
        <label className="block">
          <span className="label">Per</span>
          <select name="unit" className="input" defaultValue={initial?.unit}>
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </label>
      </div>

      <label className="mb-3.5 block">
        <span className="label">Quantity available</span>
        <input name="quantity" inputMode="decimal" className="input" defaultValue={initial?.quantity} required />
        {err('quantity') && <p className="mt-1 text-sm text-clay">{err('quantity')}</p>}
      </label>

      <div className="mb-3.5 rounded-[10px] border border-line bg-paper px-3 py-2.5">
        <span className="label mb-0.5">Location</span>
        <p className="inline-flex items-center gap-1.5 text-[15px]">
          <PinIcon className="h-4 w-4 text-muted" /> {initial?.town}, {initial?.region}
        </p>
        <p className="mt-0.5 text-[12.5px] text-muted">
          {locationNote ?? (
            <>
              Every listing sells from your farm&apos;s location.{' '}
              <Link href="/account/edit" className="font-semibold text-leaf-dark hover:underline">Update it in your profile</Link> if it&apos;s changed.
            </>
          )}
        </p>
      </div>

      <label className="mb-3.5 block">
        <span className="label">
          Expected harvest date <span className="font-normal text-muted">(optional — leave blank if available now)</span>
        </span>
        <input
          type="date"
          name="expectedHarvestDate"
          className="input"
          defaultValue={initial?.expectedHarvestDate}
          min={toDateInput(today)}
          max={toDateInput(max)}
        />
        {err('expectedHarvestDate') && <p className="mt-1 text-sm text-clay">{err('expectedHarvestDate')}</p>}
      </label>

      <div className="mb-3.5">
        <span className="label">Photos</span>
        <ImageUploader initial={initial?.images} />
      </div>

      <div className="mb-3.5 rounded-[10px] border border-line p-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="deliveryAvailable"
            defaultChecked={initial?.deliveryAvailable ?? false}
            onChange={(e) => setDeliveryAvailable(e.target.checked)}
          />
          <span className="text-sm font-semibold">Delivery available (leave unchecked for pickup only)</span>
        </label>
        {deliveryAvailable && (
          <div className="mt-3">
            <fieldset>
              <legend className="label mb-1">
                Who pays for delivery? <span className="font-normal text-muted">(the cost itself is arranged with the buyer — it varies too much to fix here)</span>
              </legend>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="deliveryPaidBy"
                    value="BUYER"
                    defaultChecked={(initial?.deliveryPaidBy ?? 'BUYER') === 'BUYER'}
                  />
                  Buyer pays — arranged directly with me
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="deliveryPaidBy"
                    value="FARMER"
                    defaultChecked={initial?.deliveryPaidBy === 'FARMER'}
                  />
                  I deliver for free
                </label>
              </div>
            </fieldset>
          </div>
        )}
      </div>

      <div className="mb-3.5">
        <span className="label">
          Product variants <span className="font-normal text-muted">(optional — e.g. Small/Medium/Large at different prices)</span>
        </span>
        <VariantEditor initial={initial?.variants} />
      </div>

      <label className="mb-4 block">
        <span className="label">
          Anything buyers should know? <span className="font-normal text-muted">(optional)</span>
        </span>
        <textarea
          name="description"
          rows={3}
          className="input"
          defaultValue={initial?.description ?? ''}
          placeholder="Harvest days, minimum order, packaging…"
        />
      </label>

      {state.error && <p className="mb-3 text-sm text-clay">{state.error}</p>}
      <SubmitButton className="btn w-full" pendingLabel="Posting…">{submitLabel}</SubmitButton>
    </form>
  );
}
