'use client';

import { useFormStatus } from 'react-dom';

/**
 * Disables on submit so a slow action can't be double-clicked, and swaps in
 * a pending label so there's visible feedback during the wait. For a form
 * with more than one submit button sharing one action (e.g. Approve/Reject),
 * pass name/value for each — useFormStatus's in-flight FormData tells each
 * button whether IT was the one clicked, so only that one shows its pending
 * label while its sibling just disables (both stop double-submits either way).
 */
export function SubmitButton({
  children,
  pendingLabel,
  className = 'btn',
  name,
  value,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending, data } = useFormStatus();
  const isThisButton = pending && (!name || data?.get(name) === value);
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={className}>
      {isThisButton ? (pendingLabel ?? 'Working…') : children}
    </button>
  );
}
