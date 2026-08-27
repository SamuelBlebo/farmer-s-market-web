import { Suspense } from 'react';
import Link from 'next/link';
import { ToastListener } from '@/components/toast-listener';
import { AccountActionButton, AccountActionRow } from '@/components/account-action-row';
import { VerifiedBadge } from '@/components/badges';
import {
  BadgeCheckIcon,
  CalendarIcon,
  ClockIcon,
  DocumentIcon,
  GridIcon,
  HeartIcon,
  LockIcon,
  ShieldIcon,
  SignOutIcon,
  SproutIcon,
  StoreIcon,
  UserIcon,
} from '@/components/icons';
import { FarmCard } from '@/components/farm-card';
import { ProductCard } from '@/components/product-card';
import { ProfileHero } from '@/components/profile-hero';
import { SectionCard, SectionRow } from '@/components/section-card';
import { StatCard } from '@/components/stat-card';
import { VerificationRow } from '@/components/verification-row';
import { lastActiveLabel } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/server/authz';
import { logout } from '@/server/actions/auth';
import { getRecentlyViewedProducts, getSavedFarms } from '@/server/queries';

const ROLE_LABEL = { FARMER: 'Farmer', BUYER: 'Buyer', ADMIN: 'Platform Admin' } as const;

export default async function AccountPage() {
  const user = await requireUser();

  const [dbUser, farmerProfile, buyerProfile] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
    user.role === 'FARMER' ? prisma.farmerProfile.findUnique({ where: { userId: user.id } }) : null,
    user.role === 'BUYER' ? prisma.buyerProfile.findUnique({ where: { userId: user.id } }) : null,
  ]);

  // Every stat below is a real count from existing data — nothing here tracks
  // page views or contact clicks, so those aren't presented as metrics.
  type Stat = { icon: React.ReactNode; label: string; value: number; emptyIcon?: React.ReactNode; emptyMessage?: string; emptyHref?: string; emptyLinkLabel?: string };
  let stats: Stat[] = [];

  if (farmerProfile) {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 86_400_000);
    const [active, sold, savedByBuyers, harvestsThisWeek] = await Promise.all([
      prisma.product.count({ where: { farmerId: farmerProfile.id, status: 'ACTIVE', moderation: 'APPROVED' } }),
      prisma.product.count({ where: { farmerId: farmerProfile.id, status: 'SOLD' } }),
      prisma.favorite.count({ where: { product: { farmerId: farmerProfile.id } } }),
      prisma.product.count({
        where: { farmerId: farmerProfile.id, status: 'ACTIVE', expectedHarvestDate: { gte: now, lte: weekFromNow } },
      }),
    ]);
    stats = [
      { icon: <StoreIcon />, label: 'Active listings', value: active },
      { icon: <BadgeCheckIcon />, label: 'Sold', value: sold },
      { icon: <HeartIcon className="h-[18px] w-[18px]" />, label: 'Saved by buyers', value: savedByBuyers },
      {
        icon: <CalendarIcon />,
        label: 'Harvests this week',
        value: harvestsThisWeek,
        emptyIcon: <SproutIcon className="h-5 w-5" />,
        emptyMessage: 'No upcoming harvests.',
        emptyHref: '/dashboard/listings/new?mode=full',
        emptyLinkLabel: 'Add Harvest',
      },
    ];
  } else if (buyerProfile) {
    const [saved, open, pending, approved] = await Promise.all([
      prisma.favorite.count({ where: { userId: user.id } }),
      prisma.wantedListing.count({ where: { buyer: { userId: user.id }, status: 'OPEN', moderation: 'APPROVED' } }),
      prisma.wantedListing.count({ where: { buyer: { userId: user.id }, moderation: 'PENDING' } }),
      prisma.wantedListing.count({ where: { buyer: { userId: user.id }, moderation: 'APPROVED' } }),
    ]);
    stats = [
      {
        icon: <HeartIcon className="h-[18px] w-[18px]" />,
        label: 'Favorite listings',
        value: saved,
        emptyIcon: <HeartIcon className="h-5 w-5" />,
        emptyMessage: 'No favorite listings yet.',
        emptyHref: '/',
        emptyLinkLabel: 'Browse produce',
      },
      { icon: <DocumentIcon />, label: 'Open requests', value: open },
      { icon: <ClockIcon />, label: 'Pending review', value: pending },
      { icon: <BadgeCheckIcon />, label: 'Requests approved', value: approved },
    ];
  } else if (user.role === 'ADMIN') {
    const [verifiedFarmers, categories, pendingApprovals, openReports] = await Promise.all([
      prisma.farmerProfile.count({ where: { verification: 'VERIFIED' } }),
      prisma.category.count(),
      prisma.product.count({ where: { moderation: 'PENDING' } }).then(async (p) => {
        const w = await prisma.wantedListing.count({ where: { moderation: 'PENDING' } });
        return p + w;
      }),
      prisma.report.count({ where: { status: 'OPEN' } }),
    ]);
    stats = [
      { icon: <BadgeCheckIcon />, label: 'Verified farmers', value: verifiedFarmers },
      { icon: <StoreIcon />, label: 'Categories', value: categories },
      { icon: <ClockIcon />, label: 'Pending approvals', value: pendingApprovals },
      { icon: <DocumentIcon />, label: 'Reports', value: openReports },
    ];
  }

  const memberSince = dbUser.createdAt.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  const activeLabel = lastActiveLabel(dbUser.lastActiveAt);
  const savedFarms = buyerProfile ? await getSavedFarms(user.id) : [];
  // Buyer/admin feature only — farmers don't browse the marketplace the same way.
  const recentlyViewed = user.role !== 'FARMER' ? await getRecentlyViewedProducts(user.id) : [];

  return (
    <div className="mx-auto max-w-[760px]">
      <Suspense>
        <ToastListener messages={{ saved: 'Profile updated.', passwordChanged: 'Password changed.' }} />
      </Suspense>

      <ProfileHero
        avatarUrl={dbUser.image}
        avatarLetter={dbUser.name[0]}
        name={dbUser.name}
        roleLabel={ROLE_LABEL[user.role]}
        verification={farmerProfile?.verification}
        region={farmerProfile?.region ?? buyerProfile?.region}
        memberSince={memberSince}
        lastActive={activeLabel}
      />

      {stats.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <StatCard
              key={s.label}
              icon={s.icon}
              label={s.label}
              value={s.value}
              emptyIcon={s.emptyIcon}
              emptyMessage={s.emptyMessage}
              emptyHref={s.emptyHref}
              emptyLinkLabel={s.emptyLinkLabel}
            />
          ))}
        </div>
      )}

      <div className={`grid gap-4 ${farmerProfile || user.role === 'ADMIN' ? 'sm:grid-cols-2' : ''}`}>
        <SectionCard title="Personal Information" editHref="/account/edit">
          <dl className="divide-y divide-line">
            <SectionRow label="Phone" value={dbUser.phone} />
            {dbUser.email && <SectionRow label="Email" value={dbUser.email} />}
            {farmerProfile && <SectionRow label="Region" value={farmerProfile.region} />}
            {farmerProfile && <SectionRow label="Town" value={farmerProfile.town} />}
            {farmerProfile && <SectionRow label="Farm name" value={farmerProfile.farmName} />}
            {buyerProfile && <SectionRow label="Region" value={buyerProfile.region} />}
            {buyerProfile && <SectionRow label="Town" value={buyerProfile.town} />}
            {buyerProfile && <SectionRow label="Business name" value={buyerProfile.businessName} />}
            <SectionRow label="Member since" value={memberSince} />
          </dl>
        </SectionCard>

        {farmerProfile && (
          <SectionCard title="Verification">
            <div className="divide-y divide-line">
              <VerificationRow icon={<BadgeCheckIcon />} title="Farmer Verification" status={<VerifiedBadge status={farmerProfile.verification} />} />
              <VerificationRow
                icon={<CalendarIcon />}
                title="Verified On"
                status={
                  <span className="badge bg-paper text-muted">
                    {farmerProfile.verifiedAt
                      ? farmerProfile.verifiedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'Not yet'}
                  </span>
                }
              />
              <VerificationRow icon={<UserIcon />} title="Phone Number" status={<span className="badge bg-paper text-muted">On file</span>} />
            </div>
          </SectionCard>
        )}

        {user.role === 'ADMIN' && (
          <SectionCard title="Access">
            <div className="divide-y divide-line">
              <VerificationRow icon={<ShieldIcon />} title="Admin Access" status={<span className="badge bg-leaf-light text-leaf-dark">Full access</span>} />
              <VerificationRow icon={<UserIcon />} title="Role" status={<span className="badge bg-leaf-light text-leaf-dark">Platform Admin</span>} />
            </div>
          </SectionCard>
        )}
      </div>

      {buyerProfile && (
        <div className="mt-4">
          <SectionCard title="Saved Farms">
            {savedFarms.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
                {savedFarms.map((f) => <FarmCard key={f.id} farm={f} />)}
              </div>
            ) : (
              <div className="p-8 text-center">
                <HeartIcon className="mx-auto h-7 w-7 text-muted" />
                <p className="mt-1 text-sm font-semibold text-muted">No saved farms yet.</p>
                <Link href="/" className="btn mt-3 inline-flex">Browse Farmers</Link>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {recentlyViewed.length > 0 && (
        <div className="mt-4">
          <SectionCard title="Recently Viewed">
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
              {recentlyViewed.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </SectionCard>
        </div>
      )}

      <div className="mt-4">
        <SectionCard title="Account Actions">
          <div className="divide-y divide-line">
            {farmerProfile && <AccountActionRow href="/dashboard" icon={<GridIcon className="h-4 w-4" />} label="Dashboard" />}
            {farmerProfile && <AccountActionRow href="/dashboard/listings" icon={<DocumentIcon className="h-4 w-4" />} label="My Listings" />}
            {buyerProfile && <AccountActionRow href="/wanted" icon={<DocumentIcon className="h-4 w-4" />} label="My Requests" />}
            {user.role === 'ADMIN' && <AccountActionRow href="/admin" icon={<ShieldIcon className="h-4 w-4" />} label="Admin Panel" />}
            <AccountActionRow href="/favorites" icon={<HeartIcon className="h-4 w-4" />} label="Saved" />
            <AccountActionRow href="/account/password" icon={<LockIcon />} label="Change Password" />
            <AccountActionButton formAction={logout} icon={<SignOutIcon />} label="Sign Out" tone="danger" />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
