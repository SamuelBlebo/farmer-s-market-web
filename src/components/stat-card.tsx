import Link from 'next/link';

export function StatCard({
  icon,
  label,
  value,
  href,
  linkLabel = 'View all',
  emptyIcon,
  emptyMessage,
  emptyHref,
  emptyLinkLabel = 'Get started',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href?: string;
  linkLabel?: string;
  /** When value is 0, show this instead of a bare "0" — a nudge, not a dead end. */
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;
  emptyHref?: string;
  emptyLinkLabel?: string;
}) {
  if (emptyMessage && value === 0) {
    return (
      <div className="card flex h-full flex-col rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md">
        {emptyIcon && <div className="mb-2 text-xl" aria-hidden>{emptyIcon}</div>}
        <p className="text-[13px] font-semibold text-muted">{emptyMessage}</p>
        {emptyHref && (
          <Link href={emptyHref} className="mt-auto inline-flex items-center gap-1 pt-2 text-[12.5px] font-bold text-leaf-dark hover:underline">
            {emptyLinkLabel} →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="card flex h-full flex-col rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-leaf-light text-leaf-dark">{icon}</div>
      <div className="font-num text-2xl font-bold leading-none tracking-tight">{value}</div>
      <p className="mt-1.5 text-[13px] font-medium text-muted">{label}</p>
      {href && (
        <Link href={href} className="mt-auto inline-flex items-center gap-1 pt-2 text-[12.5px] font-bold text-leaf-dark hover:underline">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
