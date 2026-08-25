import Link from 'next/link';
import { MobileMenu } from './mobile-menu';
import { NavLinks } from './nav-links';
import { ProfileMenu } from './profile-menu';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@/server/authz';

const VERIFICATION_LABEL = { VERIFIED: 'Verified', PENDING: 'Pending', UNVERIFIED: 'Unverified' } as const;

export async function Nav() {
  const user = await currentUser();

  const [requestsCount, dbUser, farmerProfile, buyerProfile] = await Promise.all([
    prisma.wantedListing.count({ where: { status: 'OPEN', moderation: 'APPROVED' } }),
    user ? prisma.user.findUnique({ where: { id: user.id }, select: { image: true } }) : null,
    user?.role === 'FARMER' ? prisma.farmerProfile.findUnique({ where: { userId: user.id } }) : null,
    user?.role === 'BUYER' ? prisma.buyerProfile.findUnique({ where: { userId: user.id } }) : null,
  ]);

  let primary = user?.name ?? '';
  let secondary: string | undefined;
  let menuItems: { label: string; href: string }[] = [];
  let useShield = false;

  if (user?.role === 'FARMER' && farmerProfile) {
    secondary = `${VERIFICATION_LABEL[farmerProfile.verification]} Farmer • ${farmerProfile.region}`;
    menuItems = [
      { label: 'My Account', href: '/account' },
      { label: 'My Listings', href: '/dashboard' },
      { label: 'Requests', href: '/wanted' },
    ];
  } else if (user?.role === 'BUYER' && buyerProfile) {
    secondary = `Buyer • ${buyerProfile.region}`;
    menuItems = [
      { label: 'My Account', href: '/account' },
      { label: 'My Requests', href: '/wanted' },
    ];
  } else if (user?.role === 'ADMIN') {
    useShield = true;
    primary = 'Platform Admin';
    menuItems = [
      { label: 'Admin Panel', href: '/admin' },
      { label: 'My Account', href: '/account' },
    ];
  }

  return (
    <header className="card relative z-30 mb-5 flex items-center gap-4 px-4 py-3">
      <Link href="/" className="text-[17px] font-extrabold tracking-tight">
        Farmers<span className="text-leaf">Market</span>
      </Link>

      <NavLinks loggedIn={Boolean(user)} requestsCount={requestsCount} />

      <div className="ml-auto flex items-center gap-2.5">
        {user ? (
          <>
            {user.role === 'FARMER' && (
              <Link href="/dashboard/listings/new" className="btn hidden !py-2 sm:inline-flex">+ Post produce</Link>
            )}
            {user.role === 'BUYER' && (
              <Link href="/wanted/new" className="btn hidden !bg-clay !py-2 hover:!brightness-95 sm:inline-flex">+ Post a request</Link>
            )}
            <ProfileMenu
              avatarUrl={dbUser?.image}
              avatarLetter={user.name[0]?.toUpperCase() ?? '?'}
              primary={primary}
              secondary={secondary}
              useShield={useShield}
              items={menuItems}
            />
          </>
        ) : (
          <div className="hidden items-center gap-2 sm:flex">
            <Link href="/login" className="btn-ghost">Sign in</Link>
            <Link href="/register" className="btn">Join</Link>
          </div>
        )}

        <MobileMenu
          loggedIn={Boolean(user)}
          requestsCount={requestsCount}
          primary={user ? primary : undefined}
          secondary={secondary}
          items={menuItems}
        />
      </div>
    </header>
  );
}
