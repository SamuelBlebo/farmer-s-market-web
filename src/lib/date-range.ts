export type DateRangeKey = 'today' | '7d' | '30d' | 'all';

export const DATE_RANGES: { key: DateRangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: 'all', label: 'All Time' },
];

export const DEFAULT_RANGE: DateRangeKey = '7d';

/** Single source of truth for turning the shared ?range= param into a `createdAt` lower bound — every dashboard section calls this, nothing re-derives its own. */
export function resolveDateRange(key: string | undefined): Date | undefined {
  const now = new Date();
  switch (key) {
    case 'today': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case '30d':
      return new Date(now.getTime() - 30 * 86_400_000);
    case 'all':
      return undefined;
    case '7d':
    default:
      return new Date(now.getTime() - 7 * 86_400_000);
  }
}
