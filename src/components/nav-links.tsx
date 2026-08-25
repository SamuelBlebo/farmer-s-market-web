'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeartIcon } from './icons';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({
  loggedIn,
  requestsCount,
  orientation = 'row',
  onNavigate,
}: {
  loggedIn: boolean;
  requestsCount: number;
  orientation?: 'row' | 'col';
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `font-semibold transition-colors ${isActive(pathname, href) ? 'text-ink' : 'text-muted hover:text-ink'}`;

  return (
    <nav
      className={
        orientation === 'row'
          ? 'hidden items-center gap-5 text-sm sm:flex'
          : 'flex flex-col gap-1 text-[15px]'
      }
    >
      <Link href="/" onClick={onNavigate} className={linkClass('/')}>
        Marketplace
      </Link>
      <Link href="/wanted" onClick={onNavigate} className={`${linkClass('/wanted')} inline-flex items-center gap-1.5`}>
        Requests
        {requestsCount > 0 && (
          <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-clay px-1 text-[10px] font-bold leading-none text-white">
            {requestsCount > 99 ? '99+' : requestsCount}
          </span>
        )}
      </Link>
      {loggedIn && (
        <Link href="/favorites" onClick={onNavigate} aria-label="Favorites" className={`${linkClass('/favorites')} inline-flex items-center gap-1.5`}>
          <HeartIcon className="h-[18px] w-[18px]" />
          {orientation === 'col' && <span>Favorites</span>}
        </Link>
      )}
    </nav>
  );
}
