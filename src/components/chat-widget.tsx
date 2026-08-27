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

/** Floating popup chat box — opens over whatever page you're on, on the opposite corner from the feedback widget. */
export function ChatWidget({ conversationId, onClose }: { conversationId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

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

  return (
    <div
      role="dialog"
      aria-label="Chat"
      className="card fixed inset-x-4 bottom-4 z-40 flex h-[min(560px,calc(100vh-2rem))] flex-col overflow-hidden shadow-lg sm:inset-x-auto sm:left-4 sm:w-[380px]"
    >
      <div className="flex items-center gap-2.5 border-b border-line px-3.5 py-3">
        <div className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-leaf-light text-sm font-extrabold text-leaf-dark">
          {detail?.otherAvatar ? (
            <Image src={detail.otherAvatar} alt="" fill sizes="36px" className="object-cover" />
          ) : (
            detail?.otherName[0] ?? '…'
          )}
        </div>
        <div className="min-w-0 flex-1">
          {detail?.otherFarmerProfileId ? (
            <Link href={`/farmers/${detail.otherFarmerProfileId}`} className="block truncate text-[14px] font-bold hover:underline">
              {detail.otherName}
            </Link>
          ) : (
            <p className="truncate text-[14px] font-bold">{detail?.otherName ?? 'Chat'}</p>
          )}
          {detail?.product && <p className="truncate text-[11.5px] text-muted">Re: {detail.product.name}</p>}
        </div>
        {detail && (
          <Link href={`/messages/${detail.id}`} onClick={onClose} className="shrink-0 text-[11.5px] font-semibold text-leaf-dark hover:underline">
            Open
          </Link>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-paper"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 p-3">
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
  );
}
