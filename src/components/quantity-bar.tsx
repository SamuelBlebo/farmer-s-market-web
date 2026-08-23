import { formatPrice, formatQty } from '@/lib/format';

/**
 * The signature block: price sits above how much of the original lot is left.
 * Wholesalers scan for quantity first, so it gets equal weight to price.
 */
export function PriceQuantity({
  priceMinor,
  unit,
  quantity,
  initialQty,
}: {
  priceMinor: number;
  unit: string;
  quantity: number | string;
  initialQty: number | string;
}) {
  const left = Number(quantity);
  const start = Math.max(Number(initialQty), left, 1);
  const pct = Math.max(2, Math.round((left / start) * 100));

  return (
    <div>
      <div className="font-num text-xl font-bold tracking-tight">
        {formatPrice(priceMinor)}
        <span className="ml-1 font-sans text-xs font-semibold text-muted">/ {unit}</span>
      </div>
      <div className="mt-1.5">
        <div className="mb-1 flex justify-between text-[11.5px] font-semibold text-muted">
          <span>
            {formatQty(left)} {unit} left
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-[5px] overflow-hidden rounded-full bg-[#E7EDE7]">
          <div className="h-full rounded-full bg-leaf" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
