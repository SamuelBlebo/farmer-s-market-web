'use client';

import { useEffect, useRef, useState } from 'react';
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

/** Floating popup chat box — opens over whatever page you're on, draggable by its header to wherever's convenient. */
export function ChatWidget({ conversationId, onClose }: { conversationId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

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

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Don't hijack clicks on the name link, "Open" link, or close button.
    if ((e.target as HTMLElement).closest('a,button')) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: rect.left, originY: rect.top };
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || !rootRef.current) return;
    const { startX, startY, originX, originY } = dragRef.current;
    const rect = rootRef.current.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;
    const x = Math.min(Math.max(0, originX + (e.clientX - startX)), Math.max(0, maxX));
    const y = Math.min(Math.max(0, originY + (e.clientY - startY)), Math.max(0, maxY));
    setPos({ x, y });
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label="Chat"
      style={pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined}
      className={`card fixed z-40 flex h-[min(70vh,560px)] w-[min(92vw,380px)] flex-col overflow-hidden shadow-lg ${
        pos ? '' : 'bottom-4 left-4'
      }`}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`flex touch-none items-center gap-2.5 border-b border-line px-3.5 py-3 ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
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
