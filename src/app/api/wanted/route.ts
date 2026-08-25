import { NextResponse } from 'next/server';
import { getWanted } from '@/server/queries';

export const dynamic = 'force-dynamic';

/** Read-only wanted-listings feed for the mobile app. Same envelope shape as /api/products. */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const { items, total, page, pages } = await getWanted(Number(sp.get('page') ?? 1) || 1);

  return NextResponse.json({
    page,
    pages,
    total,
    items: items.map((w) => ({
      id: w.id,
      productName: w.productName,
      quantity: w.quantity,
      town: w.town,
      region: w.region,
      neededBy: w.neededBy,
      description: w.description,
      buyer: { businessName: w.buyer.businessName, whatsapp: w.buyer.whatsapp },
    })),
  });
}
