'use client';

import { useFormState } from 'react-dom';
import { usePathname } from 'next/navigation';
import { BadgeCheckIcon } from './icons';
import { SubmitButton } from './submit-button';
import { submitFeedback, type FeedbackActionState } from '@/server/actions/feedback';

/** Full-page counterpart to the floating FeedbackWidget — same server action, in-page layout. */
export function ReportProblemForm() {
  const pathname = usePathname();
  const [state, formAction] = useFormState(submitFeedback, {} as FeedbackActionState);

  if (state.success) {
    return (
      <div className="card p-5 text-center">
        <BadgeCheckIcon className="mx-auto h-7 w-7 text-leaf-dark" />
        <p className="mt-1 font-bold">Thanks — we got it.</p>
        <p className="mt-1 text-sm text-muted">An admin reviews every submission.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="card p-5">
      <input type="hidden" name="page" value={pathname} />
      <label className="block">
        <span className="label">What went wrong?</span>
        <textarea
          name="message"
          rows={4}
          required
          minLength={5}
          className="input"
          placeholder="The more detail, the faster we can fix it — what were you doing, what did you expect, what happened instead?"
        />
      </label>
      {state.error && <p className="mt-1.5 text-sm text-clay">{state.error}</p>}
      <SubmitButton className="btn mt-3" pendingLabel="Sending…">Report problem</SubmitButton>
    </form>
  );
}
