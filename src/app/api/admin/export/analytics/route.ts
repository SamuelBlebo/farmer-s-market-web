import { NextResponse } from 'next/server';
import { toCsv } from '@/lib/csv';
import { DATE_RANGES, DEFAULT_RANGE, resolveDateRange } from '@/lib/date-range';
import { requireAdmin } from '@/server/authz';
import { getAnalyticsOverview } from '@/server/admin-analytics';

export async function GET(request: Request) {
  await requireAdmin();
  const range = new URL(request.url).searchParams.get('range') ?? undefined;
  const rangeLabel = DATE_RANGES.find((r) => r.key === range)?.label ?? DATE_RANGES.find((r) => r.key === DEFAULT_RANGE)!.label;
  const overview = await getAnalyticsOverview(resolveDateRange(range));

  const csv = toCsv(
    ['Metric', 'Count', 'Range'],
    [
      ['Product Views', overview.productViews, rangeLabel],
      ['Farmer Storefront Views', overview.farmerViews, rangeLabel],
      ['Chat Clicks', overview.whatsappClicks, rangeLabel],
      ['Call Clicks', overview.callClicks, rangeLabel],
      ['Searches Performed', overview.searches, rangeLabel],
      ['New Follows', overview.newFollows, rangeLabel],
    ],
  );

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="analytics-summary.csv"',
    },
  });
}
