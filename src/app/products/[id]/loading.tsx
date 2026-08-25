export default function ProductLoading() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
      <div>
        <div className="h-72 animate-pulse rounded-card bg-line" />
        <div className="mt-5 h-7 w-2/3 animate-pulse rounded bg-line" />
        <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-line" />
      </div>
      <div>
        <div className="card mb-3.5 h-56 animate-pulse p-4" />
        <div className="card h-40 animate-pulse p-4" />
      </div>
    </div>
  );
}
