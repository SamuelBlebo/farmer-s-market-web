import Link from 'next/link';
import { ChevronDownIcon } from './icons';

/** Icon + label navigable row for the Account Actions card. */
export function AccountActionRow({ href, icon, label, tone = 'default' }: { href: string; icon: React.ReactNode; label: string; tone?: 'default' | 'danger' }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-paper ${tone === 'danger' ? 'text-clay' : 'text-ink'}`}
    >
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${tone === 'danger' ? 'bg-clay-light' : 'bg-paper'}`}>{icon}</span>
      <span className="flex-1 text-sm font-semibold">{label}</span>
      <ChevronDownIcon className="h-4 w-4 -rotate-90 text-muted" />
    </Link>
  );
}

/** Same visual row, but a form-submit button — for Sign Out. */
export function AccountActionButton({
  formAction,
  icon,
  label,
  tone = 'default',
}: {
  formAction: (formData: FormData) => void | Promise<void>;
  icon: React.ReactNode;
  label: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <form action={formAction}>
      <button
        type="submit"
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-paper ${tone === 'danger' ? 'text-clay' : 'text-ink'}`}
      >
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${tone === 'danger' ? 'bg-clay-light' : 'bg-paper'}`}>{icon}</span>
        <span className="flex-1 text-sm font-semibold">{label}</span>
      </button>
    </form>
  );
}
