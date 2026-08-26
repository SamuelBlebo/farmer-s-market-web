import Link from 'next/link';

/** A titled card wrapper — optionally with a small "Edit" link in the header. */
export function SectionCard({
  title,
  editHref,
  children,
}: {
  title: string;
  editHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {editHref && (
          <Link href={editHref} className="text-[12.5px] font-bold text-leaf-dark hover:underline">
            Edit
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

/** A label/value row for a dl of SectionRows — wrap the group in a <dl>. */
export function SectionRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-bold">{value}</dd>
    </div>
  );
}
