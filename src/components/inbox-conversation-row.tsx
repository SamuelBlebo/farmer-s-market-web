'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useChatWidget } from './chat-widget-provider';
import { MicIcon } from './icons';
import { chatTimeLabel } from '@/lib/format';
import type { ConversationSummary } from '@/server/chat';

/** An inbox row — opens the floating widget on a plain click, falls back to the full thread page for new-tab/modifier clicks. */
export function InboxConversationRow({ conversation: c }: { conversation: ConversationSummary }) {
  const { openChat } = useChatWidget();

  return (
    <Link
      href={`/messages/${c.id}`}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        openChat(c.id);
      }}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-paper"
    >
      <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-leaf-light text-base font-extrabold text-leaf-dark">
        {c.otherAvatar ? (
          <Image src={c.otherAvatar} alt="" fill sizes="44px" className="object-cover" />
        ) : (
          c.otherName[0]
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`truncate text-[15px] ${c.unreadCount > 0 ? 'font-bold' : 'font-semibold'}`}>{c.otherName}</span>
          <span className="shrink-0 text-[12px] text-muted">{chatTimeLabel(c.lastMessageAt)}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className={`flex min-w-0 items-center gap-1 truncate text-[13px] ${c.unreadCount > 0 ? 'font-semibold text-ink' : 'text-muted'}`}>
            {c.productName && <span className="text-muted">Re: {c.productName} — </span>}
            {c.lastMessageIsVoice && <MicIcon className="h-3 w-3 shrink-0" />}
            {c.lastMessage ?? 'Say hello.'}
          </p>
          {c.unreadCount > 0 && (
            <span className="grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-leaf px-1.5 text-[11px] font-bold text-white">
              {c.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
