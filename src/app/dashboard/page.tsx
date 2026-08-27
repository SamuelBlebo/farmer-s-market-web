import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AccountActionRow } from '@/components/account-action-row';
import { ToastListener } from '@/components/toast-listener';
import { StatusBadge } from '@/components/badges';
import { BadgeCheckIcon, DocumentIcon, HeartIcon, PauseIcon, PlusIcon, StoreIcon, UserIcon } from '@/components/icons';
import { LifecycleBadge } from '@/components/badges';
import { ProfileHero } from '@/components/profile-hero';
import { SectionCard } from '@/components/section-card';
import { StatCard } from '@/components/stat-card';
import { formatPrice, formatQty, getProductLifecycle, harvestLabel, lastActiveLabel, timeAgo } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { requireFarmerProfile } from '@/server/authz';
import { getUpcomingHarvests, getWeeklyFarmerSummary } from '@/server/queries';

export default async function DashboardPage() {
  const { user, profile } = await requireFarmerProfile();

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 86_400_000);

  const [dbUser, products, recent, openRequests, savedByBuyers, harvestsThisWeek, upcomingHarvests, weeklySummary] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { image: true, lastActiveAt: true } }),
    prisma.product.findMany({
      where: { farmerId: profile.id, status: { not: 'REMOVED' } },
      select: { status: true, moderation: true },
    }),
    prisma.product.findMany({
      where: { farmerId: profile.id, status: { not: 'REMOVED' } },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: { category: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    }),
    prisma.wantedListing.count({ where: { status: 'OPEN', moderation: 'APPROVED' } }),
    prisma.favorite.count({ where: { product: { farmerId: profile.id } } }),
    prisma.product.count({
      where: { farmerId: profile.id, status: 'ACTIVE', expectedHarvestDate: { gte: now, lte: weekFromNow } },
    }),
    getUpcomingHarvests(profile.id),
    getWeeklyFarmerSummary(profile.id, user.id),
  ]);

  const active = products.filter((p) => p.status === 'ACTIVE' && p.moderation === 'APPROVED').length;
  const sold = products.filter((p) => p.status === 'SOLD').length;
  const paused = products.filter((p) => p.status === 'PAUSED').length;
  const pendingApproval = products.filter((p) => p.moderation === 'PENDING').length;

  const firstName = user.name.split(' ')[0];
  const memberSince = profile.createdAt.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

  return (
    <>
      <ProfileHero
        avatarUrl={dbUser.image}
        avatarLetter={user.name[0]}
        name={user.name}
        heading={`Welcome back, ${firstName} 👋`}
        roleLabel="Farmer"
        verification={profile.verification}
        region={profile.region}
        memberSince={memberSince}
        lastActive={lastActiveLabel(dbUser.lastActiveAt)}
        summary={
          <>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
              <span aria-hidden>🌱</span> {active} Active Listing{active === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
              <span aria-hidden>⭐</span> {savedByBuyers} Saved by Buyers
            </span>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
              <span aria-hidden>📅</span> {harvestsThisWeek} Harvest{harvestsThisWeek === 1 ? '' : 's'} This Week
            </span>
          </>
        }
        actions={
          <>
            <Link href="/dashboard/listings/new?mode=full" className="btn sm:flex-1">
              <PlusIcon className="h-4 w-4" />
              New Listing
            </Link>
            <Link href="/dashboard/listings/new" className="btn-ghost sm:flex-1">
              ⚡ Quick Post
            </Link>
          </>
        }
      />

      <div className="mb-6">
        <SectionCard title="This Week">
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            <StatCard icon={<UserIcon />} label="New followers" value={weeklySummary.newFollowers} />
            <StatCard icon={<HeartIcon className="h-[18px] w-[18px]" />} label="Saved listings" value={weeklySummary.savedListings} />
            <StatCard icon={<PlusIcon className="h-4 w-4" />} label="Listings posted" value={weeklySummary.listingsPosted} />
            <StatCard icon={<DocumentIcon />} label="Harvests coming up" value={harvestsThisWeek} />
          </div>
        </SectionCard>
      </div>

      <Suspense>
        <ToastListener
          messages={{
            posted: 'Listing posted — an admin will review it, usually the same day.',
            saved: 'Changes saved.',
          }}
        />
      </Suspense>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<StoreIcon />} label="Active listings" value={active} href="/dashboard/listings" />
        <StatCard icon={<BadgeCheckIcon />} label="Sold listings" value={sold} href="/dashboard/listings#lifecycle-SOLD_OUT" />
        <StatCard icon={<PauseIcon />} label="Paused listings" value={paused} href="/dashboard/listings#lifecycle-PAUSED" />
        <StatCard icon={<DocumentIcon />} label="Pending approval" value={pendingApproval} href="/dashboard/listings" />
      </div>

      <div className="mb-6">
        <SectionCard title="Quick Actions">
          <div className="grid grid-cols-2 gap-px bg-line">
            <AccountActionRow className="bg-white" href="/dashboard/listings" icon={<DocumentIcon className="h-4 w-4" />} label="My Listings" />
            <AccountActionRow className="bg-white" href="/wanted" icon={<DocumentIcon className="h-4 w-4" />} label="Requests" />
            <AccountActionRow className="bg-white" href="/favorites" icon={<HeartIcon className="h-4 w-4" />} label="Saved" />
            <AccountActionRow className="bg-white" href="/account" icon={<UserIcon />} label="Account" />
          </div>
        </SectionCard>
      </div>

      {upcomingHarvests.length > 0 && (
        <div className="mb-6">
          <SectionCard title="Upcoming Harvest Calendar">
            <div className="divide-y divide-line">
              {upcomingHarvests.map((p) => {
                const lifecycle = getProductLifecycle(p.status, p.expectedHarvestDate);
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3.5">
                    <span className="flex-1 truncate text-sm font-semibold">{p.name}</span>
                    <span className="shrink-0 text-[12.5px] text-muted">
                      {p.expectedHarvestDate ? harvestLabel(p.expectedHarvestDate) : '—'}
                    </span>
                    <LifecycleBadge lifecycle={lifecycle} />
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Recent Listings</h2>
            <Link href="/dashboard/listings" className="text-[12.5px] font-bold text-leaf-dark hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-semibold text-muted">Post your first harvest.</p>
              <Link href="/dashboard/listings/new?mode=full" className="btn mt-3 inline-flex">New Listing</Link>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {recent.map((p) => {
                const thumb = p.images[0]?.url;
                return (
                  <Link
                    key={p.id}
                    href={`/dashboard/listings/${p.id}/edit`}
                    className="flex items-center gap-3 py-2.5 first:pt-3"
                  >
                    <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-gradient-to-br from-[#E9F1E9] to-[#D6E5D8] text-lg">
                      {thumb ? (
                        <Image src={thumb} alt="" fill sizes="44px" className="object-cover" />
                      ) : (
                        <span aria-hidden>{p.category.emoji ?? '🌿'}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">{p.name}</div>
                      <div className="text-[12.5px] text-muted">
                        {formatQty(String(p.quantity))} {p.unit} · {formatPrice(p.priceMinor)}
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={p.status} />
                      <div className="mt-1 text-[11px] text-muted">{timeAgo(p.createdAt)}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="card rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Market Requests</h2>
            <Link href="/wanted" className="text-[12.5px] font-bold text-leaf-dark hover:underline">View all</Link>
          </div>
          <Link href="/wanted" className="mt-2 flex items-center gap-3 rounded-[10px] border border-line p-3 transition-colors hover:bg-paper">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-leaf-light font-num text-sm font-extrabold text-leaf-dark">
              {openRequests}
            </span>
            <span>
              <span className="block font-bold">Open requests from buyers</span>
              <span className="block text-[12.5px] text-muted">Great opportunities to sell more produce.</span>
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}
