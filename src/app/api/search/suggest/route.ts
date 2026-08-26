import { NextResponse } from 'next/server';
import { getSearchSuggestions } from '@/server/queries';

/** Marketplace search autocomplete — reuses the same match rules as getMarketProducts, trimmed for a dropdown. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') ?? '';
  const items = await getSearchSuggestions(q);

  return NextResponse.json({
    items: items.map((p) => ({
      id: p.id,
      name: p.name,
      unit: p.unit,
      priceMinor: p.priceMinor,
      image: p.images[0]?.url ?? null,
      category: { name: p.category.name, emoji: p.category.emoji },
    })),
  });
}
