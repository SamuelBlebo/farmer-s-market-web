export default function SystemHealthLoading() {
  return (
    <div className="animate-skeleton-fade">
      <div className="mb-4 h-8 w-56 animate-pulse rounded bg-line" />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-[68px] animate-pulse p-3" />
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, section) => (
        <div key={section} className="card mb-5 divide-y divide-line">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-4">
              <div className="h-4 w-1/3 animate-pulse rounded bg-line" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-line" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
