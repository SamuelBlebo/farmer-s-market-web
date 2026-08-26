import { NextResponse } from 'next/server';
import { toCsv } from '@/lib/csv';
import { resolveDateRange } from '@/lib/date-range';
import { requireAdmin } from '@/server/authz';
import { getTopFarmers } from '@/server/admin-analytics';

export async function GET(request: Request) {
  await requireAdmin();
  const range = new URL(request.url).searchParams.get('range') ?? undefined;
  const rows = await getTopFarmers(resolveDateRange(range), 500);

  const csv = toCsv(
    ['Farmer', 'Followers', 'Storefront Views', 'Active Listings', 'Trust Score'],
    rows.map((f) => [f.farmName, f.followers, f.storefrontViews, f.activeListings, f.trustScore]),
  );

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="farmers.csv"',
    },
  });
}
