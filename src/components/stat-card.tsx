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
  compact = false,
}: {
  icon: React.ReactNode;
  label: string;
  /** Usually a count; a non-number (e.g. "Aug 2026" for a "Member since" tile) is fine too — emptiness logic below only applies to numbers. */
  value: React.ReactNode;
  href?: string;
  linkLabel?: string;
  /** When value is 0, show this instead of a bare "0" — a nudge, not a dead end. */
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;
  emptyHref?: string;
  emptyLinkLabel?: string;
  /** Smaller padding, icon, and value text — for tighter stat rows like a farmer storefront's reputation strip. */
  compact?: boolean;
}) {
  if (emptyMessage && typeof value === 'number' && value === 0) {
    return (
      <div className={`card flex h-full flex-col rounded-xl shadow-sm transition-shadow hover:shadow-md ${compact ? 'p-2.5' : 'p-3'}`}>
        {emptyIcon && <div className={`mb-1.5 ${compact ? 'text-base' : 'text-lg'}`} aria-hidden>{emptyIcon}</div>}
        <p className="text-[12.5px] font-semibold text-muted">{emptyMessage}</p>
        {emptyHref && (
          <Link href={emptyHref} className="mt-auto inline-flex items-center gap-1 pt-2 text-[12px] font-bold text-leaf-dark hover:underline">
            {emptyLinkLabel} →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`card flex h-full flex-col rounded-xl shadow-sm transition-shadow hover:shadow-md ${compact ? 'p-2.5' : 'p-3'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className={`grid shrink-0 place-items-center rounded-[8px] bg-leaf-light text-leaf-dark ${compact ? 'h-6 w-6' : 'h-7 w-7'}`}>{icon}</div>
        <div className={`font-num font-bold leading-none tracking-tight ${compact ? 'text-base' : 'text-lg'}`}>{value}</div>
      </div>
      <div className={`mt-auto flex items-center justify-between gap-2 ${compact ? 'pt-1' : 'pt-1.5'}`}>
        <p className={`truncate font-medium text-muted ${compact ? 'text-[11px]' : 'text-[12px]'}`}>{label}</p>
        {href && (
          <Link href={href} className="shrink-0 text-[12px] font-bold text-leaf-dark hover:underline">
            {linkLabel} →
          </Link>
        )}
      </div>
    </div>
  );
}
