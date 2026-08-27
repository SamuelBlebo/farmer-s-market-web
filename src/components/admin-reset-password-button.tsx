'use client';

import { useState, useTransition } from 'react';
import { adminResetPassword } from '@/server/actions/admin';
import { useToast } from './toast-provider';

/** Generates a temp password for a user with no self-service email reset — shown once, for the admin to relay directly. */
export function AdminResetPasswordButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const toast = useToast();

  function reset() {
    if (!confirm('Generate a new temporary password? Their current password stops working immediately.')) return;
    startTransition(async () => {
      try {
        setNewPassword(await adminResetPassword(userId));
      } catch {
        toast.error('Could not reset the password — try again.');
      }
    });
  }

  if (newPassword) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-gold-light px-2 py-1 text-[12px] font-bold text-[#8A6100]">
        New password: <span className="font-num">{newPassword}</span>
      </span>
    );
  }

  return (
    <button type="button" onClick={reset} disabled={isPending} className="btn-ghost !px-3 !py-1.5 !text-[13px]">
      {isPending ? 'Resetting…' : 'Reset password'}
    </button>
  );
}
