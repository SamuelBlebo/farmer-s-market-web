import Link from 'next/link';
import {
  BadgeCheckIcon,
  CalendarIcon,
  ClockIcon,
  DocumentIcon,
  GridIcon,
  HeartIcon,
  PinIcon,
  PlusIcon,
  ShieldIcon,
  StoreIcon,
  UserIcon,
} from './icons';
import { MobileMenu } from './mobile-menu';
import { NavLinks, type NavItem } from './nav-links';
import { NotificationBell } from './notification-bell';
import { ProfileMenu } from './profile-menu';
import { TrustBar } from './trust-bar';
import { lastActiveLabel } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@/server/authz';

const VERIFICATION_LABEL = { VERIFIED: 'Verified', PENDING: 'Pending', UNVERIFIED: 'Unverified' } as const;
const ROLE_LABEL = { FARMER: 'Farmer', BUYER: 'Buyer', ADMIN: 'Admin' } as const;

export async function Nav() {
  const user = await currentUser();

  const [requestsCount, dbUser, farmerProfile, buyerProfile, farmerAttention, buyerAttention, adminAttention] = await Promise.all([
    prisma.wantedListing.count({ where: { status: 'OPEN', moderation: 'APPROVED' } }),
    user ? prisma.user.findUnique({ where: { id: user.id }, select: { image: true, lastActiveAt: true } }) : null,
    user?.role === 'FARMER' ? prisma.farmerProfile.findUnique({ where: { userId: user.id } }) : null,
    user?.role === 'BUYER' ? prisma.buyerProfile.findUnique({ where: { userId: user.id } }) : null,
    // "Needs attention" counts — real, per-role, not decorative.
    user?.role === 'FARMER'
      ? prisma.product.count({ where: { farmer: { userId: user.id }, moderation: 'REJECTED' } })
      : 0,
    user?.role === 'BUYER'
      ? prisma.wantedListing.count({ where: { buyer: { userId: user.id }, moderation: 'REJECTED' } })
      : 0,
    user?.role === 'ADMIN'
      ? Promise.all([
          prisma.product.count({ where: { moderation: 'PENDING' } }),
          prisma.wantedListing.count({ where: { moderation: 'PENDING' } }),
          prisma.report.count({ where: { status: 'OPEN' } }),
        ]).then(([a, b, c]) => a + b + c)
      : 0,
  ]);

  const items: NavItem[] = [
    { label: 'Marketplace', href: '/', icon: <StoreIcon /> },
    { label: 'Requests', href: '/wanted', icon: <DocumentIcon />, badge: requestsCount },
  ];

  const favoritesItem = { label: 'Saved', href: '/favorites', icon: <HeartIcon className="h-4 w-4" /> };

  let name = user?.name ?? '';
  let roleLabel: string = user ? ROLE_LABEL[user.role] : '';
  let accountItems: { label: string; href: string; icon: React.ReactNode }[] = [
    favoritesItem,
    { label: 'My Account', href: '/account', icon: <UserIcon /> },
  ];
  let useShield = false;
  let bellHref = '/account';
  let bellCount = 0;
  let bellLabel = '';
  let postAction: { label: string; href: string; icon: React.ReactNode } | null = null;

  if (user?.role === 'FARMER' && farmerProfile) {
    roleLabel = `${VERIFICATION_LABEL[farmerProfile.verification]} Farmer`;
    postAction = { label: 'Add Product', href: '/dashboard/listings/new', icon: <PlusIcon className="h-4 w-4" /> };
    accountItems = [
      { label: 'Dashboard', href: '/dashboard', icon: <GridIcon className="h-4 w-4" /> },
      { label: 'My Listings', href: '/dashboard/listings', icon: <DocumentIcon className="h-4 w-4" /> },
      { label: 'Requests', href: '/wanted', icon: <DocumentIcon className="h-4 w-4" /> },
      favoritesItem,
      { label: 'My Account', href: '/account', icon: <UserIcon /> },
    ];
    bellHref = '/dashboard/listings';
    bellCount = farmerAttention;
    bellLabel = 'Listings needing attention';
  } else if (user?.role === 'BUYER' && buyerProfile) {
    postAction = { label: 'Post Request', href: '/wanted/new', icon: <PlusIcon className="h-4 w-4" /> };
    accountItems = [
      { label: 'My Requests', href: '/wanted', icon: <DocumentIcon className="h-4 w-4" /> },
      favoritesItem,
      { label: 'My Account', href: '/account', icon: <UserIcon /> },
    ];
    bellHref = '/wanted';
    bellCount = buyerAttention;
    bellLabel = 'Requests needing attention';
  } else if (user?.role === 'ADMIN') {
    items.push({ label: 'Admin Panel', href: '/admin', icon: <ShieldIcon className="h-[18px] w-[18px]" /> });
    useShield = true;
    accountItems = [
      { label: 'Admin Dashboard', href: '/admin', icon: <ShieldIcon className="h-4 w-4" /> },
      favoritesItem,
      { label: 'My Account', href: '/account', icon: <UserIcon /> },
    ];
    bellHref = '/admin';
    bellCount = adminAttention as number;
    bellLabel = 'Items awaiting review';
  }

  const trustItems: { icon: React.ReactNode; label: string; sublabel?: string; tone?: 'leaf' }[] = [];
  if (user?.role === 'FARMER' && farmerProfile) {
    trustItems.push(
      {
        icon: <BadgeCheckIcon />,
        label: `${VERIFICATION_LABEL[farmerProfile.verification]} Farmer`,
        sublabel: `ID: FM-${farmerProfile.id.slice(-6).toUpperCase()}`,
        tone: 'leaf',
      },
      { icon: <PinIcon />, label: farmerProfile.region, sublabel: `${farmerProfile.town}, Ghana` },
      {
        icon: <CalendarIcon />,
        label: 'Member since',
        sublabel: farmerProfile.createdAt.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      },
      { icon: <ClockIcon />, label: lastActiveLabel(dbUser?.lastActiveAt ?? null), sublabel: undefined, tone: 'leaf' },
    );
  } else if (user?.role === 'BUYER' && buyerProfile) {
    trustItems.push(
      { icon: <PinIcon />, label: buyerProfile.region, sublabel: `${buyerProfile.town}, Ghana` },
      {
        icon: <CalendarIcon />,
        label: 'Member since',
        sublabel: buyerProfile.createdAt.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      },
      { icon: <ClockIcon />, label: lastActiveLabel(dbUser?.lastActiveAt ?? null), tone: 'leaf' },
    );
  }

  return (
    <div className="mb-5">
      <header className="card relative z-30 flex items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center text-[17px] font-extrabold leading-none tracking-[-0.01em] text-[#111827]">
          Farmers<span className="text-[#15803D]">Market</span>
        </Link>

        <NavLinks items={items} />

        <div className="ml-auto flex items-center gap-1.5">
          {user ? (
            <>
              {postAction && (
                <Link href={postAction.href} className="btn hidden !py-2 sm:inline-flex">
                  {postAction.icon}
                  {postAction.label}
                </Link>
              )}
              <NotificationBell href={bellHref} count={bellCount} label={bellLabel} />
              <ProfileMenu
                avatarUrl={dbUser?.image}
                avatarLetter={user.name[0]?.toUpperCase() ?? '?'}
                name={name}
                roleLabel={roleLabel}
                useShield={useShield}
                items={accountItems}
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
            navItems={items}
            postAction={postAction}
            primary={user ? name : undefined}
            secondary={roleLabel || undefined}
            accountItems={accountItems}
          />
        </div>
      </header>

      {trustItems.length > 0 && (
        <div className="mt-3">
          <TrustBar items={trustItems} />
        </div>
      )}
    </div>
  );
}
