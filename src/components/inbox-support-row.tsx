'use client';

import Link from 'next/link';
import { useSupportWidget } from './support-widget-provider';
import { ChatIcon } from './icons';
import { chatTimeLabel } from '@/lib/format';

export type SupportPreview = { lastMessage: string | null; lastMessageAt: Date; unreadCount: number } | null;

/** Pinned at the top of the inbox, always — opens the floating widget on a plain click, same fallback pattern as a regular InboxConversationRow. */
export function InboxSupportRow({ preview }: { preview: SupportPreview }) {
  const { openSupport } = useSupportWidget();

  return (
    <Link
      href="/messages?support=1"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        openSupport();
      }}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-paper"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-leaf-dark text-white">
        <ChatIcon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`truncate text-[15px] ${preview && preview.unreadCount > 0 ? 'font-bold' : 'font-semibold'}`}>Support</span>
          {preview && <span className="shrink-0 text-[12px] text-muted">{chatTimeLabel(preview.lastMessageAt)}</span>}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className={`truncate text-[13px] ${preview && preview.unreadCount > 0 ? 'font-semibold text-ink' : 'text-muted'}`}>
            {preview?.lastMessage ?? 'Chat with our team'}
          </p>
          {preview && preview.unreadCount > 0 && (
            <span className="grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-leaf px-1.5 text-[11px] font-bold text-white">
              {preview.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
