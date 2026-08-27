'use client';

import { useFormState } from 'react-dom';
import { ImageUploader } from './image-uploader';
import { SubmitButton } from './submit-button';
import { createProduct, type ActionState } from '@/server/actions/products';

/**
 * Same createProduct action as the full ProductForm — just fewer visible
 * fields. Category/unit/region/town are prefilled and sent as hidden inputs
 * instead of asked for, so a farmer can publish in well under 30 seconds.
 */
export function QuickPostForm({
  categoryId,
  categoryName,
  unit,
  region,
  town,
}: {
  categoryId: string;
  categoryName: string;
  unit: string;
  region: string;
  town: string;
}) {
  const [state, formAction] = useFormState(createProduct, {} as ActionState);
  const err = (f: string) => state.fieldErrors?.[f]?.[0];

  return (
    <form action={formAction} className="card p-5">
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="unit" value={unit} />
      <input type="hidden" name="region" value={region} />
      <input type="hidden" name="town" value={town} />

      <div className="mb-3.5">
        <span className="label">Photo</span>
        <ImageUploader max={1} />
      </div>

      <label className="mb-3.5 block">
        <span className="label">What are you selling?</span>
        <input name="name" className="input" placeholder="e.g. Fresh Tomatoes" required autoFocus />
        {err('name') && <p className="mt-1 text-sm text-clay">{err('name')}</p>}
      </label>

      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Price (GH¢)</span>
          <input name="price" inputMode="decimal" className="input" required />
          {err('price') && <p className="mt-1 text-sm text-clay">{err('price')}</p>}
        </label>
        <label className="block">
          <span className="label">Quantity ({unit})</span>
          <input name="quantity" inputMode="decimal" className="input" required />
          {err('quantity') && <p className="mt-1 text-sm text-clay">{err('quantity')}</p>}
        </label>
      </div>

      <p className="mb-3.5 text-[12.5px] text-muted">
        Selling from {town}, {region} — your farm&apos;s location · Category: {categoryName}. Switch to the full form to change the category, add photos, harvest date, or variants.
      </p>

      {state.error && <p className="mb-3 text-sm text-clay">{state.error}</p>}
      <SubmitButton className="btn w-full" pendingLabel="Posting…">⚡ Post in seconds</SubmitButton>
    </form>
  );
}
