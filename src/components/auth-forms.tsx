'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { SubmitButton } from './submit-button';
import { REGIONS } from '@/lib/constants';
import { login, register, type AuthState } from '@/server/actions/auth';

export function LoginForm() {
  const [state, formAction] = useFormState(login, {} as AuthState);

  return (
    <form action={formAction} className="card p-5">
      <label className="mb-3.5 block">
        <span className="label">Email</span>
        <input name="email" type="email" className="input" required autoComplete="email" />
      </label>
      <label className="mb-4 block">
        <span className="label">Password</span>
        <input name="password" type="password" className="input" required autoComplete="current-password" />
      </label>
      {state.error && <p className="mb-3 text-sm text-clay">{state.error}</p>}
      <SubmitButton className="btn w-full" pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}

export function RegisterForm() {
  const [role, setRole] = useState<'FARMER' | 'BUYER'>('FARMER');
  const [state, formAction] = useFormState(register, {} as AuthState);
  const err = (f: string) => state.fieldErrors?.[f]?.[0];

  const roleCard = (value: 'FARMER' | 'BUYER', emoji: string, title: string, sub: string) => (
    <button
      type="button"
      onClick={() => setRole(value)}
      className={`card p-4 text-center ${role === value ? 'border-leaf bg-leaf-light' : ''}`}
    >
      <div className="text-2xl" aria-hidden>{emoji}</div>
      <div className="text-sm font-bold">{title}</div>
      <div className="text-xs text-muted">{sub}</div>
    </button>
  );

  return (
    <form action={formAction} className="card p-5">
      <input type="hidden" name="role" value={role} />
      <p className="eyebrow mb-2">I am a…</p>
      <div className="mb-4 grid grid-cols-2 gap-3">
        {roleCard('FARMER', '🌱', 'Farmer', 'I sell produce')}
        {roleCard('BUYER', '🧺', 'Buyer', 'I buy produce')}
      </div>

      <label className="mb-3.5 block">
        <span className="label">Your name</span>
        <input name="name" className="input" required />
        {err('name') && <p className="mt-1 text-sm text-clay">{err('name')}</p>}
      </label>

      <label className="mb-3.5 block">
        <span className="label">{role === 'FARMER' ? 'Farm name' : 'Business name'}</span>
        <input name="businessName" className="input" placeholder={role === 'FARMER' ? 'Kofi Mensah Farms' : 'Mensah Foods Ltd'} required />
      </label>

      <label className="mb-3.5 block">
        <span className="label">Email</span>
        <input name="email" type="email" className="input" required autoComplete="email" />
        {err('email') && <p className="mt-1 text-sm text-clay">{err('email')}</p>}
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
        </label>
      </div>

      <label className="mb-4 block">
        <span className="label">Password</span>
        <input name="password" type="password" className="input" required autoComplete="new-password" />
        {err('password') && <p className="mt-1 text-sm text-clay">{err('password')}</p>}
      </label>

      {state.error && <p className="mb-3 text-sm text-clay">{state.error}</p>}
      <SubmitButton className="btn w-full" pendingLabel="Creating…">Create account</SubmitButton>
      <p className="mt-2 text-center text-[12px] text-muted">
        New farmers start as Unverified. Post a listing and an admin reviews you within a day.
      </p>
    </form>
  );
}
