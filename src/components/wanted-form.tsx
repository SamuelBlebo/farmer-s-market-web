'use client';

import { useFormState } from 'react-dom';
import { SubmitButton } from './submit-button';
import { REGIONS } from '@/lib/constants';
import { createWanted, type WantedState } from '@/server/actions/wanted';

export function WantedForm({ defaultRegion, defaultTown }: { defaultRegion: string; defaultTown: string }) {
  const [state, formAction] = useFormState(createWanted, {} as WantedState);
  const err = (f: string) => state.fieldErrors?.[f]?.[0];

  return (
    <form action={formAction} className="card p-5">
      <label className="mb-3.5 block">
        <span className="label">What are you looking for?</span>
        <input name="productName" className="input" placeholder="e.g. Puna Yam" required />
        {err('productName') && <p className="mt-1 text-sm text-clay">{err('productName')}</p>}
      </label>

      <label className="mb-3.5 block">
        <span className="label">How much do you need?</span>
        <input name="quantity" className="input" placeholder="e.g. 2 tonnes, or 300 crates weekly" required />
        {err('quantity') && <p className="mt-1 text-sm text-clay">{err('quantity')}</p>}
      </label>

      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Region</span>
          <select name="region" className="input" defaultValue={defaultRegion}>
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">Town</span>
          <input name="town" className="input" defaultValue={defaultTown} required />
        </label>
      </div>

      <label className="mb-3.5 block">
        <span className="label">Needed by <span className="font-normal text-muted">(optional)</span></span>
        <input type="date" name="neededBy" className="input" />
      </label>

      <label className="mb-4 block">
        <span className="label">Details <span className="font-normal text-muted">(optional)</span></span>
        <textarea name="description" rows={3} className="input" placeholder="Quality, packaging, whether you collect…" />
      </label>

      <SubmitButton className="btn w-full" pendingLabel="Posting…">Post request</SubmitButton>
    </form>
  );
}
