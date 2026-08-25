export default function AccountLoading() {
  return (
    <div className="mx-auto max-w-[480px]">
      <div className="mb-5 text-center">
        <div className="mx-auto h-20 w-20 animate-pulse rounded-full bg-line" />
        <div className="mx-auto mt-3 h-6 w-40 animate-pulse rounded bg-line" />
      </div>
      <div className="card divide-y divide-line">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between p-3.5">
            <div className="h-4 w-24 animate-pulse rounded bg-line" />
            <div className="h-4 w-20 animate-pulse rounded bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
