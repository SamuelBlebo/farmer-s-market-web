'use client';

import { useFormState } from 'react-dom';
import Link from 'next/link';
import { SubmitButton } from './submit-button';
import { REGIONS } from '@/lib/constants';
import { adminCreateFarmer, type AdminCreateFarmerState } from '@/server/actions/admin';

/** Sets up a farmer account for someone who called or reached the platform by USSD — a temp password is shown once for the admin to relay. */
export function AdminCreateFarmerForm() {
  const [state, formAction] = useFormState(adminCreateFarmer, {} as AdminCreateFarmerState);
  const err = (f: string) => state.fieldErrors?.[f]?.[0];

  if (state.success) {
    return (
      <div className="card p-5">
        <p className="font-bold">Farmer account created — {state.farmName}</p>
        <p className="mt-1 text-sm text-muted">
          Relay this temporary password to the farmer so they can sign in themselves later if they ever get web access.
        </p>
        <p className="mt-3 rounded-[10px] bg-gold-light px-3 py-2 text-center font-num text-lg font-bold text-[#8A6100]">
          {state.tempPassword}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link href={`/admin/listings/new?farmerId=${state.farmerId}`} className="btn flex-1 text-center">
            Add their first listing
          </Link>
          <Link href={`/farmers/${state.farmerId}`} className="btn-ghost flex-1 text-center">
            View storefront
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="card p-5">
      <label className="mb-3.5 block">
        <span className="label">Farmer&apos;s name</span>
        <input name="name" className="input" required />
        {err('name') && <p className="mt-1 text-sm text-clay">{err('name')}</p>}
      </label>

      <label className="mb-3.5 block">
        <span className="label">Farm name</span>
        <input name="farmName" className="input" placeholder="Kofi Mensah Farms" required />
        {err('farmName') && <p className="mt-1 text-sm text-clay">{err('farmName')}</p>}
      </label>

      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Phone</span>
          <input name="phone" className="input" placeholder="024 410 1234" required inputMode="tel" />
          {err('phone') && <p className="mt-1 text-sm text-clay">{err('phone')}</p>}
        </label>
        <label className="block">
          <span className="label">WhatsApp</span>
          <input name="whatsapp" className="input" placeholder="Same as phone" inputMode="tel" />
        </label>
      </div>

      <div className="mb-3.5 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Region</span>
          <select name="region" className="input" defaultValue="Bono East">
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">Town</span>
          <input name="town" className="input" required />
          {err('town') && <p className="mt-1 text-sm text-clay">{err('town')}</p>}
        </label>
      </div>

      <label className="mb-3.5 block">
        <span className="label">Description <span className="font-normal text-muted">(optional)</span></span>
        <textarea name="description" rows={3} className="input" placeholder="Family farm on 12 acres, tomatoes and peppers…" />
      </label>

      <label className="mb-4 flex items-center gap-2">
        <input type="checkbox" name="verified" />
        <span className="text-sm font-semibold">Mark as verified now</span>
      </label>

      {state.error && <p className="mb-3 text-sm text-clay">{state.error}</p>}
      <SubmitButton className="btn w-full" pendingLabel="Creating…">Create farmer account</SubmitButton>
    </form>
  );
}
