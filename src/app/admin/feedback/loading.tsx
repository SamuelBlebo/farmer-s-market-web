export default function AdminFeedbackLoading() {
  return (
    <div className="animate-skeleton-fade">
      <div className="mb-4 h-8 w-40 animate-pulse rounded bg-line" />
      <div className="card divide-y divide-line">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-line" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-line" />
            </div>
            <div className="h-8 w-24 shrink-0 animate-pulse rounded-[10px] bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
