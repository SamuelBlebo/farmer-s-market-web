'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { StarIcon } from './icons';
import { SubmitButton } from './submit-button';
import { submitReview, type ReviewActionState } from '@/server/actions/reviews';

/** Star-rating + comment form a signed-in buyer uses to review a farmer — also doubles as the edit form for their existing review. */
export function ReviewForm({
  farmerId,
  initialRating,
  initialComment,
  pending,
}: {
  farmerId: string;
  initialRating?: number;
  initialComment?: string | null;
  /** The buyer already has a review awaiting moderation — shown as a note, editing still works and re-queues it. */
  pending?: boolean;
}) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [state, formAction] = useFormState(submitReview, {} as ReviewActionState);

  if (state.success) {
    return (
      <div className="card p-4 text-center">
        <p className="font-bold">Thanks for the review.</p>
        <p className="mt-1 text-sm text-muted">An admin reviews it before it goes live — usually the same day.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="card p-4">
      <input type="hidden" name="farmerId" value={farmerId} />
      <input type="hidden" name="rating" value={rating} />

      {pending && (
        <p className="mb-2.5 text-[12.5px] font-semibold text-muted">
          Your review is awaiting approval — editing and resubmitting is fine.
        </p>
      )}

      <span className="label">Your rating</span>
      <div className="mb-3 flex gap-1" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHovered(n)}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            className="text-gold"
          >
            <StarIcon className="h-6 w-6" filled={n <= (hovered || rating)} />
          </button>
        ))}
      </div>
      {state.fieldErrors?.rating && <p className="mb-2 text-sm text-clay">{state.fieldErrors.rating[0]}</p>}

      <label className="block">
        <span className="label">Your review <span className="font-normal text-muted">(optional)</span></span>
        <textarea
          name="comment"
          rows={3}
          className="input"
          defaultValue={initialComment ?? ''}
          placeholder="What was it like buying from this farm?"
        />
      </label>

      {state.error && <p className="mt-1.5 text-sm text-clay">{state.error}</p>}
      <SubmitButton className="btn mt-3" pendingLabel="Submitting…">
        {initialRating ? 'Update review' : 'Post review'}
      </SubmitButton>
    </form>
  );
}
