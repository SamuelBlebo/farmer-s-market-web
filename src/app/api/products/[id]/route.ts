import { NextResponse } from 'next/server';
import { getProduct } from '@/server/queries';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const p = await getProduct(params.id);
  if (!p) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  return NextResponse.json({
    id: p.id,
    name: p.name,
    description: p.description,
    priceMinor: p.priceMinor,
    unit: p.unit,
    quantity: Number(p.quantity),
    initialQty: Number(p.initialQty),
    town: p.town,
    region: p.region,
    status: p.status,
    images: p.images.map((i) => i.url),
    category: { name: p.category.name, emoji: p.category.emoji },
    farmer: {
      id: p.farmer.id,
      farmName: p.farmer.farmName,
      description: p.farmer.description,
      town: p.farmer.town,
      region: p.farmer.region,
      verification: p.farmer.verification,
      // The one field the app needs to open WhatsApp.
      whatsapp: p.farmer.whatsapp,
    },
    createdAt: p.createdAt,
  });
}
