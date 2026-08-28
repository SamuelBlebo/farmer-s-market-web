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
  fromPrice,
  hidePrice = false,
}: {
  priceMinor: number;
  unit: string;
  quantity: number | string;
  initialQty: number | string;
  /** Lowest variant price, if the listing has variants — shown as "From GH¢X" instead of the flat price. */
  fromPrice?: number;
  /** Skip the price line — for callers that already show price elsewhere (e.g. next to the product name). */
  hidePrice?: boolean;
}) {
  const left = Number(quantity);
  const start = Math.max(Number(initialQty), left, 1);
  const pct = Math.max(2, Math.round((left / start) * 100));

  return (
    <div>
      {!hidePrice && (
        <div className="font-num text-xl font-bold tracking-tight">
          {fromPrice !== undefined ? (
            <>
              <span className="font-sans text-xs font-semibold text-muted">From </span>
              {formatPrice(fromPrice)}
            </>
          ) : (
            formatPrice(priceMinor)
          )}
          <span className="ml-1 font-sans text-xs font-semibold text-muted">/ {unit}</span>
        </div>
      )}
      <div className={hidePrice ? '' : 'mt-1.5'}>
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
