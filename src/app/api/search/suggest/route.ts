import { NextResponse } from 'next/server';
import { getSearchSuggestions } from '@/server/queries';

/** Marketplace search autocomplete — reuses the same match rules as getMarketProducts, trimmed for a dropdown. Now returns products, farmers, and categories together. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') ?? '';
  const { products, farmers, categories } = await getSearchSuggestions(q);

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      unit: p.unit,
      priceMinor: p.priceMinor,
      image: p.images[0]?.url ?? null,
      category: { name: p.category.name, emoji: p.category.emoji },
    })),
    farmers: farmers.map((f) => ({ id: f.id, farmName: f.farmName, region: f.region, verification: f.verification })),
    categories: categories.map((c) => ({ slug: c.slug, name: c.name, emoji: c.emoji })),
  });
}
