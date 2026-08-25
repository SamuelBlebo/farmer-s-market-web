'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { PasswordField } from './password-field';
import { SubmitButton } from './submit-button';
import { REGIONS } from '@/lib/constants';
import { login, loginAdmin, loginWithPhone, register, type AuthState } from '@/server/actions/auth';

const tab = (on: boolean) =>
  `flex-1 rounded-[10px] border px-3 py-2 text-[13px] font-bold ${
    on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-muted'
  }`;

export function LoginForm() {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [emailState, emailAction] = useFormState(login, {} as AuthState);
  const [phoneState, phoneAction] = useFormState(loginWithPhone, {} as AuthState);

  return (
    <div className="card p-5">
      <div className="mb-4 flex gap-2" role="tablist" aria-label="Sign-in method">
        <button type="button" role="tab" aria-selected={method === 'email'} onClick={() => setMethod('email')} className={tab(method === 'email')}>
          Email
        </button>
        <button type="button" role="tab" aria-selected={method === 'phone'} onClick={() => setMethod('phone')} className={tab(method === 'phone')}>
          Phone
        </button>
      </div>

      {method === 'email' ? (
        <form action={emailAction}>
          <label className="mb-3.5 block">
            <span className="label">Email</span>
            <input name="email" type="email" className="input" required autoComplete="email" />
          </label>
          <PasswordField autoComplete="current-password" />
          {emailState.error && <p className="mb-3 text-sm text-clay">{emailState.error}</p>}
          <SubmitButton className="btn w-full" pendingLabel="Signing in…">Sign in</SubmitButton>
        </form>
      ) : (
        <form action={phoneAction}>
          <label className="mb-3.5 block">
            <span className="label">Phone number</span>
            <input name="phone" type="tel" className="input" required inputMode="tel" autoComplete="tel" placeholder="024 410 1234" />
            {phoneState.fieldErrors?.phone?.[0] && <p className="mt-1 text-sm text-clay">{phoneState.fieldErrors.phone[0]}</p>}
          </label>
          <PasswordField autoComplete="current-password" />
          {phoneState.error && <p className="mb-3 text-sm text-clay">{phoneState.error}</p>}
          <SubmitButton className="btn w-full" pendingLabel="Signing in…">Sign in</SubmitButton>
        </form>
      )}
    </div>
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
        <span className="label">Email <span className="font-normal text-muted">(optional)</span></span>
        <input name="email" type="email" className="input" autoComplete="email" />
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

      <PasswordField autoComplete="new-password" error={err('password')} />

      {state.error && <p className="mb-3 text-sm text-clay">{state.error}</p>}
      <SubmitButton className="btn w-full" pendingLabel="Creating…">Create account</SubmitButton>
      <p className="mt-2 text-center text-[12px] text-muted">
        New farmers start as Unverified. Post a listing and an admin reviews you within a day.
      </p>
    </form>
  );
}

export function AdminLoginForm() {
  const [state, formAction] = useFormState(loginAdmin, {} as AuthState);

  return (
    <form action={formAction} className="card border-2 border-ink p-5">
      <label className="mb-3.5 block">
        <span className="label">Admin email</span>
        <input name="email" type="email" className="input" required autoComplete="email" />
      </label>
      <PasswordField autoComplete="current-password" />
      {state.error && <p className="mb-3 text-sm text-clay">{state.error}</p>}
      <SubmitButton className="btn w-full" pendingLabel="Signing in…">Admin sign in</SubmitButton>
    </form>
  );
}
