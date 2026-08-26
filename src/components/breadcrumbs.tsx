import Link from 'next/link';

export type Crumb = { label: string; href?: string };

/** href omitted on a middle crumb renders as plain (non-clickable) text — used where there's no real destination, e.g. "Farmers". */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 -mx-1 overflow-x-auto px-1">
      <ol className="flex items-center gap-1.5 whitespace-nowrap text-[13px]">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted" aria-hidden>/</span>}
              {item.href && !isLast ? (
                <Link href={item.href} className="font-semibold text-muted hover:text-ink">
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? 'font-bold text-ink' : 'font-semibold text-muted'}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
