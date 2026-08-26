import Link from 'next/link';
import { DATE_RANGES, DEFAULT_RANGE, type DateRangeKey } from '@/lib/date-range';

/** Plain links (not client state) so every section on the page reads the same ?range= param server-side — one shared filter, no duplicated logic. */
export function DateRangeFilter({ basePath, current }: { basePath: string; current: string | undefined }) {
  const active: DateRangeKey = (DATE_RANGES.find((r) => r.key === current)?.key ?? DEFAULT_RANGE) as DateRangeKey;

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {DATE_RANGES.map((r) => (
        <Link
          key={r.key}
          href={`${basePath}?range=${r.key}`}
          className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
            active === r.key ? 'border-leaf bg-leaf-light text-leaf-dark' : 'border-line bg-white text-muted'
          }`}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}
