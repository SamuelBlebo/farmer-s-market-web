'use client';

import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './icons';

export function PasswordField({
  label = 'Password',
  autoComplete,
  error,
}: {
  label?: string;
  autoComplete: 'current-password' | 'new-password';
  error?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="mb-4 block">
      <span className="label">{label}</span>
      <div className="relative">
        <input
          name="password"
          type={visible ? 'text' : 'password'}
          className="input pr-11"
          required
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-1 top-1/2 grid h-8 w-9 -translate-y-1/2 place-items-center text-muted"
        >
          {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-clay">{error}</p>}
    </label>
  );
}
