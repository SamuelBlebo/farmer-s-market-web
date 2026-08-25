'use client';

import { useFormState } from 'react-dom';
import { AvatarUploader } from './avatar-uploader';
import { SubmitButton } from './submit-button';
import { REGIONS } from '@/lib/constants';
import type { AccountState } from '@/server/actions/account';

type Initial = {
  name: string;
  phone: string;
  email?: string | null;
  image?: string | null;
  region?: string;
  town?: string;
  businessName?: string;
};

export function ProfileForm({
  role,
  action,
  initial,
}: {
  role: 'FARMER' | 'BUYER' | 'ADMIN';
  action: (prev: AccountState, formData: FormData) => Promise<AccountState>;
  initial: Initial;
}) {
  const [state, formAction] = useFormState(action, {} as AccountState);
  const err = (f: string) => state.fieldErrors?.[f]?.[0];

  return (
    <form action={formAction} className="card p-5">
      {role !== 'ADMIN' && (
        <div className="mb-4">
          <span className="label">Profile photo</span>
          <AvatarUploader name="image" initialUrl={initial.image} />
        </div>
      )}

      <label className="mb-3.5 block">
        <span className="label">Full name</span>
        <input name="name" className="input" defaultValue={initial.name} required />
        {err('name') && <p className="mt-1 text-sm text-clay">{err('name')}</p>}
      </label>

      {role !== 'ADMIN' && (
        <label className="mb-3.5 block">
          <span className="label">{role === 'FARMER' ? 'Farm name' : 'Business name'}</span>
          <input name="businessName" className="input" defaultValue={initial.businessName} required />
          {err('businessName') && <p className="mt-1 text-sm text-clay">{err('businessName')}</p>}
        </label>
      )}

      <label className="mb-3.5 block">
        <span className="label">Phone</span>
        <input name="phone" className="input" defaultValue={initial.phone} required inputMode="tel" />
        {err('phone') && <p className="mt-1 text-sm text-clay">{err('phone')}</p>}
      </label>

      <label className="mb-3.5 block">
        <span className="label">
          Email {role !== 'ADMIN' && <span className="font-normal text-muted">(optional)</span>}
        </span>
        <input name="email" type="email" className="input" defaultValue={initial.email ?? ''} required={role === 'ADMIN'} />
        {err('email') && <p className="mt-1 text-sm text-clay">{err('email')}</p>}
      </label>

      {role === 'FARMER' && (
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">Region</span>
            <select name="region" className="input" defaultValue={initial.region}>
              {REGIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="label">Town</span>
            <input name="town" className="input" defaultValue={initial.town} required />
          </label>
        </div>
      )}

      {state.error && <p className="mb-3 text-sm text-clay">{state.error}</p>}
      <SubmitButton className="btn w-full" pendingLabel="Saving…">Save changes</SubmitButton>
    </form>
  );
}
