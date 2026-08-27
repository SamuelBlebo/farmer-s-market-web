'use client';

import { useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { usePathname } from 'next/navigation';
import { CloseIcon } from './icons';
import { SubmitButton } from './submit-button';
import { useToast } from './toast-provider';
import { submitFeedback, type FeedbackActionState } from '@/server/actions/feedback';

/** Floating site-wide feedback button — opens a lightweight form, no page navigation. */
export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  // Wraps the server action so a successful submit can close the panel and
  // toast from here — useFormState's returned state alone can't drive that
  // reliably across repeat submissions (two successes in a row both resolve
  // to the same { success: true }, so an effect keyed on it would only fire once).
  async function action(prevState: FeedbackActionState, formData: FormData): Promise<FeedbackActionState> {
    const result = await submitFeedback(prevState, formData);
    if (result.success) {
      toast.success('Thanks — your feedback was sent.');
      setOpen(false);
      formRef.current?.reset();
    }
    return result;
  }

  const [state, formAction] = useFormState(action, {} as FeedbackActionState);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close feedback form' : 'Send feedback'}
        className="fixed bottom-20 right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-leaf text-white shadow-lg transition-colors hover:bg-leaf-dark sm:bottom-6"
      >
        {open ? <CloseIcon /> : <span aria-hidden className="text-xl">💬</span>}
      </button>

      {open && (
        <div className="card fixed bottom-[136px] right-4 z-40 w-[calc(100vw-2rem)] max-w-[320px] p-4 shadow-lg sm:bottom-24">
          <p className="mb-1 text-sm font-bold">Send feedback</p>
          <p className="mb-3 text-[12.5px] text-muted">
            Spotted a bug, or have an idea? An admin reads every message.
          </p>
          <form ref={formRef} action={formAction}>
            <input type="hidden" name="page" value={pathname} />
            <textarea
              name="message"
              rows={3}
              required
              minLength={5}
              className="input"
              placeholder="What's on your mind?"
            />
            {state.error && <p className="mt-1.5 text-[12.5px] text-clay">{state.error}</p>}
            <SubmitButton className="btn mt-2.5 w-full !py-2 !text-[13px]" pendingLabel="Sending…">
              Send
            </SubmitButton>
          </form>
        </div>
      )}
    </>
  );
}
