'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { startConversation } from '@/server/actions/chat';
import { MessageIcon } from './icons';
import { useToast } from './toast-provider';

/** Opens (or starts) the thread with the other party and navigates to it. */
export function ChatButton({
  otherUserId,
  productId,
  label = 'Chat',
  className = 'btn-ghost',
}: {
  otherUserId: string;
  productId?: string;
  label?: string;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  function open() {
    startTransition(async () => {
      try {
        const id = await startConversation(otherUserId, productId);
        router.push(`/messages/${id}`);
      } catch {
        toast.error('Could not open chat — try again.');
      }
    });
  }

  return (
    <button type="button" onClick={open} disabled={isPending} className={`inline-flex items-center justify-center gap-1.5 ${className}`}>
      <MessageIcon className="h-4 w-4" /> {isPending ? 'Opening…' : label}
    </button>
  );
}
