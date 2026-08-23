import { NextResponse } from 'next/server';
import { getWanted } from '@/server/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const listings = await getWanted();

  return NextResponse.json(
    listings.map((w) => ({
      id: w.id,
      productName: w.productName,
      quantity: w.quantity,
      town: w.town,
      region: w.region,
      neededBy: w.neededBy,
      description: w.description,
      buyer: { businessName: w.buyer.businessName, whatsapp: w.buyer.whatsapp },
    })),
  );
}
