'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
  /** Favorites: icon only, no visible label (still has an aria-label). */
  iconOnly?: boolean;
};

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({
  items,
  orientation = 'row',
  onNavigate,
}: {
  items: NavItem[];
  orientation?: 'row' | 'col';
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className={orientation === 'row' ? 'hidden items-center gap-1 sm:flex' : 'flex flex-col gap-1'}>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-label={item.iconOnly ? item.label : undefined}
            className={
              orientation === 'row'
                ? `flex items-center gap-2 rounded-full px-3 py-1.5 text-[13.5px] font-semibold transition-colors ${
                    active ? 'bg-leaf-light text-leaf-dark' : 'text-muted hover:bg-paper hover:text-ink'
                  }`
                : `flex items-center gap-2.5 rounded-[8px] px-2 py-2 text-[15px] font-semibold transition-colors ${
                    active ? 'bg-leaf-light text-leaf-dark' : 'text-ink hover:bg-paper'
                  }`
            }
          >
            {item.icon}
            {!item.iconOnly && <span>{item.label}</span>}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-clay px-1 text-[10px] font-bold leading-none text-white">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
