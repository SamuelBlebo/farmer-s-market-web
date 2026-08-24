export default function DashboardLoading() {
  return (
    <>
      <div className="mb-4 h-8 w-56 animate-pulse rounded bg-line" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-[68px] animate-pulse p-4" />
        ))}
      </div>
      <div className="card divide-y divide-line">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3.5">
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-[10px] bg-line" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-line" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-line" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
