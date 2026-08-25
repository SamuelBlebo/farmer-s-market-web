'use client';

import { useFormState } from 'react-dom';
import { ImageUploader } from './image-uploader';
import { SubmitButton } from './submit-button';
import { VariantEditor } from './variant-editor';
import { REGIONS, UNITS } from '@/lib/constants';
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
};

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function ProductForm({
  action,
  categories,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  categories: Category[];
  initial?: Initial;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, {} as ActionState);
  const err = (f: string) => state.fieldErrors?.[f]?.[0];

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

      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Quantity available</span>
          <input name="quantity" inputMode="decimal" className="input" defaultValue={initial?.quantity} required />
          {err('quantity') && <p className="mt-1 text-sm text-clay">{err('quantity')}</p>}
        </label>
        <label className="block">
          <span className="label">Region</span>
          <select name="region" className="input" defaultValue={initial?.region}>
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
      </div>

      <label className="mb-3.5 block">
        <span className="label">Town</span>
        <input name="town" className="input" defaultValue={initial?.town} placeholder="e.g. Techiman" required />
      </label>

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
