import { NextResponse } from 'next/server';
import { getMarketProducts, type MarketFilters } from '@/server/queries';
import type { SortKey } from '@/lib/constants';

/** Read-only marketplace feed for the mobile app. Same query as the web marketplace. */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const filters: MarketFilters = {
    q: sp.get('q') ?? undefined,
    category: sp.get('category') ?? undefined,
    region: sp.get('region') ?? undefined,
    min: sp.get('min') ?? undefined,
    max: sp.get('max') ?? undefined,
    verified: sp.get('verified') ?? undefined,
    sort: (sp.get('sort') as SortKey) ?? undefined,
    page: sp.get('page') ?? undefined,
  };

  const { items, total, page, pages } = await getMarketProducts(filters);

  return NextResponse.json({
    page,
    pages,
    total,
    items: items.map((p) => ({
      id: p.id,
      name: p.name,
      priceMinor: p.priceMinor,
      unit: p.unit,
      quantity: Number(p.quantity),
      initialQty: Number(p.initialQty),
      town: p.town,
      region: p.region,
      image: p.images[0]?.url ?? null,
      category: { name: p.category.name, emoji: p.category.emoji },
      farmer: { id: p.farmer.id, farmName: p.farmer.farmName, verification: p.farmer.verification },
      createdAt: p.createdAt,
    })),
  });
}
