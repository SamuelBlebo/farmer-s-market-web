export default function WantedLoading() {
  return (
    <>
      <div className="mb-1 h-8 w-40 animate-pulse rounded bg-line" />
      <div className="mb-4 h-4 w-64 animate-pulse rounded bg-line" />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-56 animate-pulse p-4" />
        ))}
      </div>
    </>
  );
}
