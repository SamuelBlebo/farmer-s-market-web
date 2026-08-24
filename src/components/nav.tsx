import Link from 'next/link';
import { currentUser } from '@/server/authz';
import { logout } from '@/server/actions/auth';

export async function Nav() {
  const user = await currentUser();

  return (
    <header className="card mb-5 flex flex-wrap items-center gap-4 px-4 py-3">
      <Link href="/" className="text-[17px] font-extrabold tracking-tight">
        Farmers<span className="text-leaf">Market</span>
      </Link>

      <nav className="flex gap-4 text-sm font-semibold text-muted">
        <Link href="/" className="hover:text-ink">Marketplace</Link>
        <Link href="/wanted" className="hover:text-ink">Wanted</Link>
        {user && <Link href="/favorites" className="hover:text-ink">Favorites</Link>}
        {user?.role === 'FARMER' && <Link href="/dashboard" className="hover:text-ink">My listings</Link>}
        {user?.role === 'ADMIN' && <Link href="/admin" className="hover:text-ink">Admin</Link>}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {user ? (
          <>
            <span className="hidden text-sm text-muted sm:inline">{user.name}</span>
            {user.role === 'FARMER' && (
              <Link href="/dashboard/listings/new" className="btn">Post produce</Link>
            )}
            {user.role === 'BUYER' && (
              <Link href="/wanted/new" className="btn">Post a request</Link>
            )}
            <form action={logout}>
              <button className="btn-ghost">Sign out</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="btn-ghost">Sign in</Link>
            <Link href="/register" className="btn">Join</Link>
          </>
        )}
      </div>
    </header>
  );
}
