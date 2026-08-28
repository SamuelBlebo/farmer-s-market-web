'use client';

import Link from 'next/link';
import type { FeedItem, FeedItemKind } from '@/server/notification-feed';
import { useSupportWidget } from './support-widget-provider';
import { BadgeCheckIcon, BellIcon, ChatIcon, FlagIcon, LeafIcon, WarningIcon } from './icons';
import { timeAgo } from '@/lib/format';

const KIND_ICON: Record<FeedItemKind, React.ReactNode> = {
  moderation: <BellIcon className="h-4 w-4" />,
  report: <FlagIcon className="h-4 w-4" />,
  farmer: <BadgeCheckIcon className="h-4 w-4" />,
  chat: <ChatIcon className="h-4 w-4" />,
  support: <ChatIcon className="h-4 w-4" />,
  rejected: <WarningIcon className="h-4 w-4" />,
  update: <LeafIcon className="h-4 w-4" />,
};

function RowContent({ item, compact }: { item: FeedItem; compact?: boolean }) {
  return (
    <>
      <div className={`grid shrink-0 place-items-center rounded-[8px] bg-leaf-light text-leaf-dark ${compact ? 'h-8 w-8' : 'h-10 w-10'}`}>
        {KIND_ICON[item.kind]}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`font-semibold ${compact ? 'text-[13px]' : 'text-sm'}`}>{item.message}</p>
        {item.subtext && <p className="truncate text-[12.5px] text-muted">{item.subtext}</p>}
        <p className="text-[12px] text-muted">{timeAgo(item.createdAt)}</p>
      </div>
    </>
  );
}

/**
 * A support reply lives in the floating widget, not a page — clicking it
 * opens the widget in place via shared context instead of navigating to a
 * dead link. Everything else is a plain link to the real page it's about.
 */
export function NotificationFeedRow({ item, compact }: { item: FeedItem; compact?: boolean }) {
  const { openSupport } = useSupportWidget();
  const rowClass = `flex w-full items-center gap-3 text-left transition-colors hover:bg-paper ${compact ? 'p-2.5' : 'p-3.5'}`;

  if (item.id === 'support-reply') {
    return (
      <button type="button" onClick={openSupport} className={rowClass}>
        <RowContent item={item} compact={compact} />
      </button>
    );
  }

  return (
    <Link href={item.href} className={rowClass}>
      <RowContent item={item} compact={compact} />
    </Link>
  );
}
