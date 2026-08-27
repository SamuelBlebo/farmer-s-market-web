import Link from 'next/link';
import { PLATFORM_NAME } from '@/lib/constants';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-line pt-5 text-[13px] text-muted">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>© {year} {PLATFORM_NAME}. Ghana&apos;s produce marketplace.</p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/" className="font-semibold hover:text-ink hover:underline">Marketplace</Link>
          <Link href="/wanted" className="font-semibold hover:text-ink hover:underline">Requests</Link>
          <Link href="/support" className="font-semibold hover:text-ink hover:underline">Support</Link>
        </nav>
      </div>
    </footer>
  );
}
