/** Route-level loading UI — shown while the product page's data loads, fading in rather than popping. */
export default function ProductLoading() {
  return (
    <div className="animate-skeleton-fade grid gap-6 lg:grid-cols-[1.25fr_1fr]">
      <div>
        <div className="h-72 animate-pulse rounded-card bg-line" />
        <div className="mt-5 h-7 w-2/3 animate-pulse rounded-[8px] bg-line" />
        <div className="mt-3 h-4 w-1/3 animate-pulse rounded-[8px] bg-line" />
      </div>
      <div className="space-y-3.5">
        <div className="card h-40 animate-pulse p-4" />
        <div className="card h-28 animate-pulse p-4" />
        <div className="card h-40 animate-pulse p-4" />
      </div>
    </div>
  );
}
