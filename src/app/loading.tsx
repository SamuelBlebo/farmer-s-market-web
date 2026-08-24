export default function MarketplaceLoading() {
  return (
    <div className="grid items-start gap-5 md:grid-cols-[230px_1fr]">
      <div className="card hidden h-[420px] animate-pulse md:block" />
      <div>
        <div className="mb-3 h-6 w-40 animate-pulse rounded bg-line" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="h-32 animate-pulse bg-line" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-line" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-line" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
