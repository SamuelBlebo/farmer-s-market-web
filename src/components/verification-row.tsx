/** Icon + title + status badge row for a trust/verification card. */
export function VerificationRow({
  icon,
  title,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  status: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-leaf-light text-leaf-dark">{icon}</span>
      <span className="flex-1 text-sm font-semibold">{title}</span>
      {status}
    </div>
  );
}
