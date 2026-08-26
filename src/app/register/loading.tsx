export default function RegisterLoading() {
  return (
    <div className="animate-skeleton-fade mx-auto max-w-[440px]">
      <div className="mb-5 text-center">
        <div className="mx-auto h-7 w-52 animate-pulse rounded bg-line" />
        <div className="mx-auto mt-2 h-4 w-64 animate-pulse rounded bg-line" />
      </div>
      <div className="card h-[520px] animate-pulse p-5" />
    </div>
  );
}
