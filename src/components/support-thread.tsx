'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { adminReplySupport, markSupportRead, markSupportReadAdmin, sendSupportMessage } from '@/server/actions/support';
import { chatDateHeading, messageBubbleTime } from '@/lib/format';
import { DoubleCheckIcon, SendIcon } from './icons';
import { useToast } from './toast-provider';

export type SupportChatMessage = {
  id: string;
  senderId: string;
  fromAdmin: boolean;
  content: string;
  createdAt: string;
  readAt: string | null;
};

// Vercel's serverless target has no persistent WebSocket support, so a short
// poll stands in for real-time push — same approach as the buyer/farmer chat.
const POLL_MS = 4000;

/**
 * The bubble thread shared by the customer-facing widget and the admin
 * inbox. Which side a message renders on is decided by fromAdmin, not by
 * comparing senderId to the viewer's own id — that way any admin who
 * replies still reads as "mine" on the admin side of a thread another
 * admin started answering.
 */
export function SupportThread({
  conversationId,
  viewerIsAdmin,
  initialMessages,
  compact = false,
}: {
  conversationId: string;
  viewerIsAdmin: boolean;
  initialMessages: SupportChatMessage[];
  compact?: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [isSending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAtRef = useRef(initialMessages.at(-1)?.createdAt ?? new Date(0).toISOString());
  const toast = useToast();

  useEffect(() => {
    if (viewerIsAdmin) void markSupportReadAdmin(conversationId);
    else void markSupportRead(conversationId);
  }, [conversationId, viewerIsAdmin]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/support/${conversationId}/messages?after=${encodeURIComponent(lastAtRef.current)}`);
        if (!res.ok) return;
        const data: { messages: SupportChatMessage[] } = await res.json();
        if (data.messages?.length) {
          setMessages((prev) => [...prev, ...data.messages]);
          lastAtRef.current = data.messages[data.messages.length - 1].createdAt;
          const fromOtherSide = data.messages.some((m) => m.fromAdmin !== viewerIsAdmin);
          if (fromOtherSide) {
            if (viewerIsAdmin) void markSupportReadAdmin(conversationId);
            else void markSupportRead(conversationId);
          }
        }
      } catch {
        // Transient network hiccup — the next tick retries.
      }
    }
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, [conversationId, viewerIsAdmin]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const content = String(new FormData(form).get('content') ?? '').trim();
    if (!content) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set('content', content);
      formData.set('conversationId', conversationId);
      const result = viewerIsAdmin ? await adminReplySupport({}, formData) : await sendSupportMessage({}, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      form.reset();
    });
  }

  return (
    <div className={compact ? 'flex h-full flex-col' : 'flex h-[70vh] flex-col'}>
      <div className="flex-1 space-y-1.5 overflow-y-auto rounded-2xl border border-line bg-leaf-light/25 p-3">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-muted">
            {viewerIsAdmin ? 'No messages in this thread yet.' : "Say hello — an admin usually replies within a day."}
          </p>
        )}
        {messages.map((m, i) => {
          const mine = viewerIsAdmin ? m.fromAdmin : !m.fromAdmin;
          const createdAt = new Date(m.createdAt);
          const prevCreatedAt = i > 0 ? new Date(messages[i - 1].createdAt) : null;
          const isNewDay = !prevCreatedAt || prevCreatedAt.toDateString() !== createdAt.toDateString();

          return (
            <div key={m.id}>
              {isNewDay && (
                <div className="my-2 flex justify-center">
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-muted shadow-sm">
                    {chatDateHeading(createdAt)}
                  </span>
                </div>
              )}
              <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-[14px] ${
                    mine ? 'rounded-br-sm bg-leaf text-white' : 'rounded-bl-sm bg-white text-ink shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p className={`mt-0.5 flex items-center justify-end gap-1 text-[10.5px] ${mine ? 'text-white/70' : 'text-muted'}`}>
                    {messageBubbleTime(createdAt)}
                    {mine && <DoubleCheckIcon className={`h-3.5 w-3.5 ${m.readAt ? 'text-white' : 'text-white/50'}`} />}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex items-end gap-2">
        <textarea
          name="content"
          rows={1}
          maxLength={2000}
          placeholder="Type a message…"
          required
          className="input min-w-0 flex-1 resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button type="submit" disabled={isSending} className="btn inline-flex shrink-0 items-center gap-1.5 !px-4">
          <SendIcon className="h-4 w-4" /> Send
        </button>
      </form>
    </div>
  );
}
