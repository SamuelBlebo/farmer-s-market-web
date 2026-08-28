'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ConversationThread, type ChatMessage } from './conversation-thread';
import { CloseIcon } from './icons';

type ConversationDetail = {
  id: string;
  viewerId: string;
  otherId: string;
  otherName: string;
  otherAvatar: string | null;
  otherFarmerProfileId: string | null;
  product: { id: string; name: string } | null;
  messages: ChatMessage[];
};

/** Chat as a proper modal — slides in from the right, dims and locks the page behind it, main focus until closed. */
export function ChatWidget({ conversationId, onClose }: { conversationId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setDetail(null);

    fetch(`/api/conversations/${conversationId}`)
      .then((res) => {
        if (!res.ok) throw new Error('failed to load conversation');
        return res.json();
      })
      .then((data: ConversationDetail) => {
        if (!cancelled) {
          setDetail(data);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // Slide-in entrance — start off-screen, animate in on the next frame.
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Lock background scroll while the modal is open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chat"
        onClick={(e) => e.stopPropagation()}
        className={`flex h-full w-full max-w-[420px] flex-col bg-white shadow-xl transition-transform duration-300 ease-out ${
          entered ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4 pb-3 pt-[calc(0.75rem_+_env(safe-area-inset-top))]">
          <div className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-leaf-light text-sm font-extrabold text-leaf-dark">
            {detail?.otherAvatar ? (
              <Image src={detail.otherAvatar} alt="" fill sizes="36px" className="object-cover" />
            ) : (
              detail?.otherName[0] ?? '…'
            )}
          </div>
          <div className="min-w-0 flex-1">
            {detail?.otherFarmerProfileId ? (
              <Link href={`/farmers/${detail.otherFarmerProfileId}`} className="block truncate text-[15px] font-bold hover:underline">
                {detail.otherName}
              </Link>
            ) : (
              <p className="truncate text-[15px] font-bold">{detail?.otherName ?? 'Chat'}</p>
            )}
            {detail?.product && <p className="truncate text-[12px] text-muted">Re: {detail.product.name}</p>}
          </div>
          {detail && (
            <Link href={`/messages?id=${detail.id}`} onClick={onClose} className="shrink-0 text-[12.5px] font-semibold text-leaf-dark hover:underline">
              Open
            </Link>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-paper"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 p-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))]">
          {status === 'loading' && <div className="flex h-full items-center justify-center text-sm text-muted">Loading…</div>}
          {status === 'error' && (
            <div className="flex h-full items-center justify-center text-center text-sm text-muted">
              Could not load this conversation.
            </div>
          )}
          {status === 'ready' && detail && (
            <ConversationThread
              conversationId={detail.id}
              currentUserId={detail.viewerId}
              initialMessages={detail.messages}
              productName={detail.product?.name}
              compact
            />
          )}
        </div>
      </div>
    </div>
  );
}
