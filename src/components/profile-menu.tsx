'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDownIcon, ShieldIcon } from './icons';
import { logout } from '@/server/actions/auth';

type MenuItem = { label: string; href: string };

/** Desktop-only profile trigger + dropdown. Mobile gets the same items inside MobileMenu instead. */
export function ProfileMenu({
  avatarUrl,
  avatarLetter,
  primary,
  secondary,
  useShield = false,
  items,
}: {
  avatarUrl?: string | null;
  avatarLetter: string;
  primary: string;
  secondary?: string;
  useShield?: boolean;
  items: MenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-full border border-line bg-white py-1 pl-1 pr-2.5 transition-colors hover:bg-paper"
      >
        {useShield ? (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-white">
            <ShieldIcon className="h-4 w-4" />
          </span>
        ) : avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-leaf-light font-bold text-leaf-dark">
            {avatarLetter}
          </span>
        )}
        <span className="text-left">
          <span className="block text-[13px] font-bold leading-tight">{primary}</span>
          {secondary && <span className="block text-[11px] leading-tight text-muted">{secondary}</span>}
        </span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="menu" className="card absolute right-0 top-[calc(100%+8px)] z-20 w-56 divide-y divide-line overflow-hidden shadow-lg">
          <div className="p-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block rounded-[8px] px-3 py-2 text-sm font-semibold text-ink hover:bg-paper"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <form action={logout} className="p-1">
            <button role="menuitem" className="block w-full rounded-[8px] px-3 py-2 text-left text-sm font-semibold text-clay hover:bg-clay-light">
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
