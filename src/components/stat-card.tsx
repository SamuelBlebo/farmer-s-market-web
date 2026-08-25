import Link from 'next/link';

export function StatCard({
  icon,
  label,
  value,
  href,
  linkLabel = 'View all',
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="card p-4">
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-[10px] bg-leaf-light text-leaf-dark">{icon}</div>
      <div className="font-num text-2xl font-bold">{value}</div>
      <p className="text-[13px] text-muted">{label}</p>
      {href && (
        <Link href={href} className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-bold text-leaf-dark hover:underline">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
