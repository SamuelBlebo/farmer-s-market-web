import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheckIcon, PinIcon } from './icons';
import { CategoryIcon } from './category-icon';
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
  category: { slug: string };
  farmer: { id: string; farmName: string; verification: string };
  variants: { priceMinor: number }[];
};

export function ProductCard({
  p,
  priority = false,
  size = 'default',
}: {
  p: Card;
  /** Set for the first few above-the-fold cards only — never for a whole grid. */
  priority?: boolean;
  /** 'sm' shrinks the image, text, and padding — for secondary rails like Recently Viewed or Trending. */
  size?: 'default' | 'sm';
}) {
  const img = p.images[0]?.url;
  const lifecycle = getProductLifecycle(p.status, p.expectedHarvestDate);
  const sm = size === 'sm';

  return (
    <div className="card flex h-full flex-col transition-all duration-150 hover:-translate-y-0.5 hover:border-[#B9CCBD] hover:shadow-md">
      <Link href={`/products/${p.id}`}>
        <div className={`relative grid place-items-center overflow-hidden rounded-t-card bg-gradient-to-br from-[#E9F1E9] to-[#D6E5D8] text-leaf-dark/70 ${sm ? 'h-20' : 'h-32'}`}>
          {img ? (
            <Image src={img} alt={p.name} fill sizes="(max-width:768px) 50vw, 240px" className="object-cover" priority={priority} />
          ) : (
            <CategoryIcon slug={p.category.slug} className={sm ? 'h-8 w-8' : 'h-12 w-12'} />
          )}
          {p.farmer.verification === 'VERIFIED' && (
            <span className="badge absolute left-2 top-2 bg-leaf-light text-leaf-dark">
              <BadgeCheckIcon className="h-3 w-3" />
            </span>
          )}
          {lifecycle !== 'ONGOING' && (
            <span className="absolute right-2 top-2">
              <LifecycleBadge lifecycle={lifecycle} />
            </span>
          )}
        </div>
        <div className={sm ? 'px-2.5 pt-2' : 'px-3 pt-3'}>
          <div className={`mb-1.5 truncate font-bold ${sm ? 'text-[13px]' : ''}`}>{p.name}</div>
          <PriceQuantity
            priceMinor={p.priceMinor}
            unit={p.unit}
            quantity={String(p.quantity)}
            initialQty={String(p.initialQty)}
            fromPrice={p.variants[0]?.priceMinor}
          />
        </div>
      </Link>
      <div className={`mt-auto flex justify-between gap-2 border-t border-line text-muted ${sm ? 'p-2.5 pt-2 text-[11px]' : 'p-3 pt-2.5 text-[12.5px]'}`}>
        <span className="inline-flex min-w-0 items-center gap-1 truncate">
          <PinIcon className="h-3 w-3 shrink-0" />
          {p.town}
        </span>
        {!sm && <FarmerPreviewTrigger farmerId={p.farmer.id} farmerName={p.farmer.farmName} />}
      </div>
    </div>
  );
}
