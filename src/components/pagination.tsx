import Link from 'next/link';

/**
 * Plain server component — every link is a real href, so it works without JS
 * and composes with whatever filters/search/sort the caller already has in
 * the URL (they're just carried through as searchParams, minus the page key).
 */
export function Pagination({
  page,
  pages,
  basePath,
  searchParams,
  pageParam = 'page',
}: {
  page: number;
  pages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
  pageParam?: string;
}) {
  if (pages <= 1) return null;

  function href(p: number) {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== pageParam) next.set(k, v);
    }
    if (p > 1) next.set(pageParam, String(p));
    const qs = next.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const windowSize = 5;
  const start = Math.max(1, Math.min(page - Math.floor(windowSize / 2), pages - windowSize + 1));
  const end = Math.min(pages, start + windowSize - 1);
  const numbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const navBtn = (disabled: boolean) =>
    `btn-ghost !px-3 !py-1.5 !text-[13px] ${disabled ? 'pointer-events-none opacity-40' : ''}`;

  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
      <Link href={href(Math.max(1, page - 1))} aria-disabled={page <= 1} className={navBtn(page <= 1)}>
        ← Prev
      </Link>
      {start > 1 && <span className="px-1 text-muted">…</span>}
      {numbers.map((n) => (
        <Link
          key={n}
          href={href(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`grid h-8 w-8 place-items-center rounded-[8px] text-[13px] font-bold ${
            n === page ? 'bg-ink text-white' : 'border border-line bg-white text-ink hover:bg-paper'
          }`}
        >
          {n}
        </Link>
      ))}
      {end < pages && <span className="px-1 text-muted">…</span>}
      <Link href={href(Math.min(pages, page + 1))} aria-disabled={page >= pages} className={navBtn(page >= pages)}>
        Next →
      </Link>
    </nav>
  );
}
