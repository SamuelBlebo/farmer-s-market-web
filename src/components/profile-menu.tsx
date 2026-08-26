'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDownIcon, ShieldIcon, SignOutIcon } from './icons';
import { logout } from '@/server/actions/auth';

type MenuItem = { label: string; href: string; icon?: React.ReactNode };

/** Desktop-only profile trigger + dropdown. Mobile gets the same items inside MobileMenu instead. */
export function ProfileMenu({
  avatarUrl,
  avatarLetter,
  name,
  roleLabel,
  useShield = false,
  items,
}: {
  avatarUrl?: string | null;
  avatarLetter: string;
  name: string;
  roleLabel: string;
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
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-paper"
      >
        <span className="relative shrink-0">
          {useShield ? (
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-white">
              <ShieldIcon className="h-4 w-4" />
            </span>
          ) : avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-full bg-leaf-dark font-bold text-white">
              {avatarLetter}
            </span>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-leaf" aria-hidden />
        </span>
        <span className="text-left">
          <span className="block text-[13.5px] font-bold leading-tight text-ink">{name}</span>
          <span className="block text-[11.5px] font-semibold leading-tight text-leaf-dark">{roleLabel}</span>
        </span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="menu" className="card absolute right-0 top-[calc(100%+8px)] z-20 w-52 divide-y divide-line overflow-hidden shadow-lg">
          <div className="p-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-paper"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
          <form action={logout} className="p-1">
            <button role="menuitem" className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-left text-sm font-semibold text-clay transition-colors hover:bg-clay-light">
              <SignOutIcon />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
