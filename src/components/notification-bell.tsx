import Link from 'next/link';
import { BellIcon } from './icons';

/**
 * Links straight to wherever the real attention items live (rejected
 * listings, rejected requests, the admin moderation queue) rather than
 * opening a notification feed we don't have data to back.
 */
export function NotificationBell({ href, count, label }: { href: string; count: number; label: string }) {
  return (
    <Link
      href={href}
      aria-label={count > 0 ? `${label}: ${count}` : label}
      className="relative hidden h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-paper hover:text-ink sm:grid"
    >
      <BellIcon />
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-clay px-1 text-[10px] font-bold leading-none text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
