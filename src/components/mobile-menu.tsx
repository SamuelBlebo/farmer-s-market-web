'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CloseIcon, MenuIcon } from './icons';
import { NavLinks } from './nav-links';
import { logout } from '@/server/actions/auth';

type MenuItem = { label: string; href: string };

/** Collapses the full nav + profile actions into one panel below the header on small screens. */
export function MobileMenu({
  loggedIn,
  requestsCount,
  primary,
  secondary,
  items,
}: {
  loggedIn: boolean;
  requestsCount: number;
  primary?: string;
  secondary?: string;
  items: MenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="grid h-9 w-9 place-items-center rounded-[8px] border border-line text-ink"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      {open && (
        <div className="card absolute inset-x-4 top-[64px] z-20 divide-y divide-line p-3 shadow-lg">
          <div className="pb-3">
            <NavLinks loggedIn={loggedIn} requestsCount={requestsCount} orientation="col" onNavigate={close} />
          </div>

          {loggedIn ? (
            <div className="pt-3">
              {(primary || secondary) && (
                <div className="mb-2 px-1">
                  {primary && <div className="text-sm font-bold">{primary}</div>}
                  {secondary && <div className="text-[12px] text-muted">{secondary}</div>}
                </div>
              )}
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="block rounded-[8px] px-2 py-2 text-sm font-semibold text-ink hover:bg-paper"
                >
                  {item.label}
                </Link>
              ))}
              <form action={logout}>
                <button className="mt-1 block w-full rounded-[8px] px-2 py-2 text-left text-sm font-semibold text-clay hover:bg-clay-light">
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex gap-2 pt-3">
              <Link href="/login" onClick={close} className="btn-ghost flex-1 justify-center">Sign in</Link>
              <Link href="/register" onClick={close} className="btn flex-1 justify-center">Join</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
