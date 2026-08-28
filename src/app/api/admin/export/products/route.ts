import { NextResponse } from 'next/server';
import { toCsv } from '@/lib/csv';
import { resolveDateRange } from '@/lib/date-range';
import { requireAdmin } from '@/server/authz';
import { getPopularProducts } from '@/server/admin-analytics';

export async function GET(request: Request) {
  await requireAdmin();
  const range = new URL(request.url).searchParams.get('range') ?? undefined;
  const rows = await getPopularProducts(resolveDateRange(range), 500);

  const csv = toCsv(
    ['Product', 'Farmer', 'Views', 'Chat Clicks', 'Call Clicks'],
    rows.map((p) => [p.name, p.farmName, p.views, p.whatsapp, p.calls]),
  );

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="products.csv"',
    },
  });
}
