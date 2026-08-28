'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChatIcon, CloseIcon } from './icons';
import { SupportThread, type SupportChatMessage } from './support-thread';

type SupportSession = { id: string; messages: SupportChatMessage[] };

/** Floating site-wide live chat with support — opens a lightweight thread, no page navigation. Replaces the old one-way feedback form. */
export function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'signed-out' | 'error'>('idle');
  const [session, setSession] = useState<SupportSession | null>(null);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && status === 'idle') {
      setStatus('loading');
      fetch('/api/support/me')
        .then((res) => {
          if (res.status === 401) {
            setStatus('signed-out');
            return null;
          }
          if (!res.ok) throw new Error('failed');
          return res.json();
        })
        .then((data: SupportSession | null) => {
          if (!data) return;
          setSession(data);
          setStatus('ready');
        })
        .catch(() => setStatus('error'));
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? 'Close support chat' : 'Chat with support'}
        className="support-btn-pos fixed right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-leaf text-white shadow-lg transition-colors hover:bg-leaf-dark"
      >
        {open ? <CloseIcon /> : <ChatIcon className="h-5 w-5" />}
      </button>

      {open && (
        <div className="support-panel-pos card fixed right-4 z-40 flex h-[440px] w-[calc(100vw-2rem)] max-w-[340px] flex-col p-4 shadow-lg">
          <p className="mb-1 text-sm font-bold">Chat with support</p>
          <p className="mb-3 text-[12.5px] text-muted">An admin usually replies within a day.</p>

          <div className="min-h-0 flex-1">
            {status === 'loading' && <div className="flex h-full items-center justify-center text-sm text-muted">Loading…</div>}
            {status === 'error' && (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted">
                Could not load the chat — try again shortly.
              </div>
            )}
            {status === 'signed-out' && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm text-muted">Sign in to chat with support.</p>
                <Link href="/login" className="btn !px-4 !py-2 !text-[13px]">Sign in</Link>
              </div>
            )}
            {status === 'ready' && session && (
              <SupportThread conversationId={session.id} viewerIsAdmin={false} initialMessages={session.messages} compact />
            )}
          </div>
        </div>
      )}
    </>
  );
}
