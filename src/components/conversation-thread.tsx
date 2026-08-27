'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { markConversationRead, sendMessage } from '@/server/actions/chat';
import { chatTimeLabel } from '@/lib/format';
import { SendIcon } from './icons';
import { useToast } from './toast-provider';

export type ChatMessage = { id: string; senderId: string; content: string; createdAt: string; readAt: string | null };

// Vercel's serverless target has no persistent WebSocket support, so a short
// poll stands in for real-time push — good enough at this app's scale.
const POLL_MS = 4000;

export function ConversationThread({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [isSending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAtRef = useRef(initialMessages.at(-1)?.createdAt ?? new Date(0).toISOString());
  const toast = useToast();

  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages?after=${encodeURIComponent(lastAtRef.current)}`);
        if (!res.ok) return;
        const data: { messages: ChatMessage[] } = await res.json();
        if (data.messages?.length) {
          setMessages((prev) => [...prev, ...data.messages]);
          lastAtRef.current = data.messages[data.messages.length - 1].createdAt;
          if (data.messages.some((m) => m.senderId !== currentUserId)) markConversationRead(conversationId);
        }
      } catch {
        // Transient network hiccup — the next tick retries.
      }
    }
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, [conversationId, currentUserId]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    if (!String(formData.get('content') ?? '').trim()) return;

    startTransition(async () => {
      const result = await sendMessage({}, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      form.reset();
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages?after=${encodeURIComponent(lastAtRef.current)}`);
        if (res.ok) {
          const data: { messages: ChatMessage[] } = await res.json();
          if (data.messages?.length) {
            setMessages((prev) => [...prev, ...data.messages]);
            lastAtRef.current = data.messages[data.messages.length - 1].createdAt;
          }
        }
      } catch {
        // Sent fine either way — the poll interval will pick it up.
      }
    });
  }

  return (
    <div className="flex h-[70vh] flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl border border-line bg-paper p-3">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-muted">Say hello — messages are private between you two.</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-[14px] ${mine ? 'bg-leaf text-white' : 'bg-white text-ink shadow-sm'}`}>
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`mt-0.5 text-right text-[10.5px] ${mine ? 'text-white/70' : 'text-muted'}`}>
                  {chatTimeLabel(new Date(m.createdAt))}
                </p>
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
          className="input flex-1 resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <input type="hidden" name="conversationId" value={conversationId} />
        <button type="submit" disabled={isSending} className="btn inline-flex shrink-0 items-center gap-1.5 !px-4">
          <SendIcon className="h-4 w-4" /> Send
        </button>
      </form>
    </div>
  );
}
