export default function FarmerLoading() {
  return (
    <div className="animate-skeleton-fade">
      <div className="card mb-5 h-40 animate-pulse p-5" />
      <div className="mb-3 h-6 w-40 animate-pulse rounded bg-line" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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
  );
}
