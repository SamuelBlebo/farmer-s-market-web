import Link from 'next/link';
import Image from 'next/image';
import { FarmerPreviewTrigger } from './farmer-preview-trigger';
import { PriceQuantity } from './quantity-bar';
import { LifecycleBadge } from './badges';
import { getProductLifecycle } from '@/lib/format';

type Card = {
  id: string;
  name: string;
  priceMinor: number;
  unit: string;
  quantity: unknown;
  initialQty: unknown;
  town: string;
  status: 'ACTIVE' | 'PAUSED' | 'SOLD' | 'REMOVED';
  expectedHarvestDate: Date | null;
  images: { url: string }[];
  category: { emoji: string | null };
  farmer: { id: string; farmName: string; verification: string };
  variants: { priceMinor: number }[];
};

export function ProductCard({ p }: { p: Card }) {
  const img = p.images[0]?.url;
  const lifecycle = getProductLifecycle(p.status, p.expectedHarvestDate);

  return (
    <div className="card overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:border-[#B9CCBD] hover:shadow-md">
      <Link href={`/products/${p.id}`}>
        <div className="relative grid h-32 place-items-center bg-gradient-to-br from-[#E9F1E9] to-[#D6E5D8] text-5xl">
          {img ? (
            <Image src={img} alt={p.name} fill sizes="(max-width:768px) 50vw, 240px" className="object-cover" />
          ) : (
            <span aria-hidden>{p.category.emoji ?? '🌿'}</span>
          )}
          {p.farmer.verification === 'VERIFIED' && (
            <span className="badge absolute left-2 top-2 bg-leaf-light text-leaf-dark">✓</span>
          )}
          {lifecycle !== 'ONGOING' && (
            <span className="absolute right-2 top-2">
              <LifecycleBadge lifecycle={lifecycle} />
            </span>
          )}
        </div>
        <div className="px-3 pt-3">
          <div className="mb-1.5 font-bold">{p.name}</div>
          <PriceQuantity
            priceMinor={p.priceMinor}
            unit={p.unit}
            quantity={String(p.quantity)}
            initialQty={String(p.initialQty)}
            fromPrice={p.variants[0]?.priceMinor}
          />
        </div>
      </Link>
      <div className="flex justify-between gap-2 border-t border-line p-3 pt-2.5 text-[12.5px] text-muted">
        <span className="truncate">📍 {p.town}</span>
        <FarmerPreviewTrigger farmerId={p.farmer.id} farmerName={p.farmer.farmName} />
      </div>
    </div>
  );
}
