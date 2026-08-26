export default function LoginLoading() {
  return (
    <div className="animate-skeleton-fade mx-auto max-w-[420px]">
      <div className="mb-5 text-center">
        <div className="mx-auto h-7 w-40 animate-pulse rounded bg-line" />
        <div className="mx-auto mt-2 h-4 w-56 animate-pulse rounded bg-line" />
      </div>
      <div className="card h-64 animate-pulse p-5" />
    </div>
  );
}
