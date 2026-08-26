import { Suspense } from 'react';
import Link from 'next/link';
import { ActionBanner } from '@/components/action-banner';
import { VerifiedBadge } from '@/components/badges';
import {
  BadgeCheckIcon,
  CalendarIcon,
  ClockIcon,
  DocumentIcon,
  HeartIcon,
  PinIcon,
  SignOutIcon,
  StoreIcon,
  UserIcon,
} from '@/components/icons';
import { StatCard } from '@/components/stat-card';
import { TrustBar } from '@/components/trust-bar';
import { lastActiveLabel } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/server/authz';
import { logout } from '@/server/actions/auth';

const ROLE_LABEL = { FARMER: 'Farmer', BUYER: 'Buyer', ADMIN: 'Admin' } as const;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-bold">{value}</dd>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <h2 className="border-b border-line px-4 py-3 text-[15px] font-semibold tracking-tight">{title}</h2>
      <dl className="divide-y divide-line">{children}</dl>
    </div>
  );
}

export default async function AccountPage() {
  const user = await requireUser();

  const [dbUser, farmerProfile, buyerProfile] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
    user.role === 'FARMER' ? prisma.farmerProfile.findUnique({ where: { userId: user.id } }) : null,
    user.role === 'BUYER' ? prisma.buyerProfile.findUnique({ where: { userId: user.id } }) : null,
  ]);

  // Every stat below is a real count from existing data — nothing here tracks
  // page views or contact clicks, so those aren't presented as metrics.
  type Stat = { icon: React.ReactNode; label: string; value: number };
  let stats: Stat[] = [];

  if (farmerProfile) {
    const [total, sold, savedByBuyers, upcomingHarvests] = await Promise.all([
      prisma.product.count({ where: { farmerId: farmerProfile.id, status: { not: 'REMOVED' } } }),
      prisma.product.count({ where: { farmerId: farmerProfile.id, status: 'SOLD' } }),
      prisma.favorite.count({ where: { product: { farmerId: farmerProfile.id } } }),
      prisma.product.count({ where: { farmerId: farmerProfile.id, status: 'ACTIVE', expectedHarvestDate: { gt: new Date() } } }),
    ]);
    stats = [
      { icon: <StoreIcon />, label: 'Listings', value: total },
      { icon: <BadgeCheckIcon />, label: 'Sold', value: sold },
      { icon: <HeartIcon className="h-[18px] w-[18px]" />, label: 'Saved by buyers', value: savedByBuyers },
      { icon: <CalendarIcon />, label: 'Upcoming harvests', value: upcomingHarvests },
    ];
  } else if (buyerProfile) {
    const [open, pending, closed, saved] = await Promise.all([
      prisma.wantedListing.count({ where: { buyer: { userId: user.id }, status: 'OPEN', moderation: 'APPROVED' } }),
      prisma.wantedListing.count({ where: { buyer: { userId: user.id }, moderation: 'PENDING' } }),
      prisma.wantedListing.count({ where: { buyer: { userId: user.id }, status: 'CLOSED' } }),
      prisma.favorite.count({ where: { userId: user.id } }),
    ]);
    stats = [
      { icon: <DocumentIcon />, label: 'Open requests', value: open },
      { icon: <ClockIcon />, label: 'Pending review', value: pending },
      { icon: <BadgeCheckIcon />, label: 'Closed requests', value: closed },
      { icon: <HeartIcon className="h-[18px] w-[18px]" />, label: 'Saved listings', value: saved },
    ];
  } else if (user.role === 'ADMIN') {
    const [farmers, buyers, pendingReviews, openReports] = await Promise.all([
      prisma.user.count({ where: { role: 'FARMER' } }),
      prisma.user.count({ where: { role: 'BUYER' } }),
      prisma.product.count({ where: { moderation: 'PENDING' } }).then(async (p) => {
        const w = await prisma.wantedListing.count({ where: { moderation: 'PENDING' } });
        return p + w;
      }),
      prisma.report.count({ where: { status: 'OPEN' } }),
    ]);
    stats = [
      { icon: <StoreIcon />, label: 'Farmers', value: farmers },
      { icon: <UserIcon className="h-[18px] w-[18px]" />, label: 'Buyers', value: buyers },
      { icon: <ClockIcon />, label: 'Pending reviews', value: pendingReviews },
      { icon: <DocumentIcon />, label: 'Open reports', value: openReports },
    ];
  }

  const memberSince = dbUser.createdAt.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

  const heroTrust: { icon: React.ReactNode; label: string; sublabel?: string; tone?: 'leaf' }[] = [];
  if (farmerProfile) heroTrust.push({ icon: <PinIcon />, label: farmerProfile.region, sublabel: `${farmerProfile.town}, Ghana` });
  else if (buyerProfile) heroTrust.push({ icon: <PinIcon />, label: buyerProfile.region, sublabel: `${buyerProfile.town}, Ghana` });
  heroTrust.push({ icon: <CalendarIcon />, label: 'Member since', sublabel: memberSince });
  heroTrust.push({ icon: <ClockIcon />, label: lastActiveLabel(dbUser.lastActiveAt), tone: 'leaf' });

  const secondCardTitle = farmerProfile ? 'Verification' : buyerProfile ? 'Business Details' : null;

  return (
    <div className="mx-auto max-w-[760px]">
      <Suspense>
        <ActionBanner messages={{ saved: 'Profile updated.', passwordChanged: 'Password changed.' }} />
      </Suspense>

      {/* Profile hero */}
      <div className="card mb-4 p-5 sm:p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-leaf-light text-3xl font-extrabold text-leaf-dark">
            {dbUser.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dbUser.image} alt="" className="h-full w-full object-cover" />
            ) : (
              dbUser.name[0]
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-2xl font-bold tracking-tight">{dbUser.name}</h1>
              {farmerProfile && <VerifiedBadge status={farmerProfile.verification} />}
            </div>
            <p className="text-muted">
              {ROLE_LABEL[user.role]}
              {farmerProfile && ` · ${farmerProfile.farmName}`}
              {buyerProfile && ` · ${buyerProfile.businessName}`}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <TrustBar items={heroTrust} />
        </div>
      </div>

      {/* Quick stats */}
      {stats.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
          ))}
        </div>
      )}

      <div className={`grid gap-4 ${secondCardTitle ? 'sm:grid-cols-2' : ''}`}>
        <InfoCard title="Personal Information">
          <Row label="Phone" value={dbUser.phone} />
          {dbUser.email && <Row label="Email" value={dbUser.email} />}
          {farmerProfile && <Row label="Region" value={farmerProfile.region} />}
          {farmerProfile && <Row label="Town" value={farmerProfile.town} />}
          <Row label="Member since" value={memberSince} />
        </InfoCard>

        {farmerProfile && (
          <InfoCard title="Verification">
            <Row label="Status" value={<VerifiedBadge status={farmerProfile.verification} />} />
            <Row
              label="Verified on"
              value={farmerProfile.verifiedAt ? farmerProfile.verifiedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            />
            <Row label="Farm name" value={farmerProfile.farmName} />
          </InfoCard>
        )}

        {buyerProfile && (
          <InfoCard title="Business Details">
            <Row label="Business name" value={buyerProfile.businessName} />
            <Row label="Region" value={buyerProfile.region} />
            <Row label="Town" value={buyerProfile.town} />
          </InfoCard>
        )}
      </div>

      {/* Account actions */}
      <div className="card mt-4 p-4">
        <h2 className="mb-3 text-[15px] font-semibold tracking-tight">Account Actions</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link href="/account/edit" className="btn sm:flex-1">Edit Profile</Link>
          <Link href="/account/password" className="btn-ghost sm:flex-1">Change Password</Link>
          {user.role === 'FARMER' && <Link href="/dashboard" className="btn-ghost sm:flex-1">Farmer Dashboard</Link>}
          <form action={logout} className="sm:flex-1">
            <button className="btn-ghost flex w-full items-center justify-center gap-2 !text-clay hover:!bg-clay-light">
              <SignOutIcon />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
