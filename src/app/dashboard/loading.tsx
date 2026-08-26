export default function DashboardLoading() {
  return (
    <div className="animate-skeleton-fade">
      <div className="mb-4 h-8 w-64 animate-pulse rounded bg-line" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-[104px] animate-pulse p-4" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card h-[220px] animate-pulse p-4" />
        ))}
      </div>
    </div>
  );
}
