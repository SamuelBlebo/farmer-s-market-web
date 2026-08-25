'use client';

import { useFormState } from 'react-dom';
import { SubmitButton } from './submit-button';
import { changePassword, type AccountState } from '@/server/actions/account';

export function ChangePasswordForm() {
  const [state, formAction] = useFormState(changePassword, {} as AccountState);
  const err = (f: string) => state.fieldErrors?.[f]?.[0];

  return (
    <form action={formAction} className="card p-5">
      <label className="mb-3.5 block">
        <span className="label">Current password</span>
        <input name="currentPassword" type="password" className="input" required autoComplete="current-password" />
        {err('currentPassword') && <p className="mt-1 text-sm text-clay">{err('currentPassword')}</p>}
      </label>
      <label className="mb-4 block">
        <span className="label">New password</span>
        <input name="newPassword" type="password" className="input" required autoComplete="new-password" />
        {err('newPassword') && <p className="mt-1 text-sm text-clay">{err('newPassword')}</p>}
      </label>
      {state.error && <p className="mb-3 text-sm text-clay">{state.error}</p>}
      <SubmitButton className="btn w-full" pendingLabel="Saving…">Change password</SubmitButton>
    </form>
  );
}
