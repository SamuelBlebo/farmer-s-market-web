import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ActionBanner } from '@/components/action-banner';
import { StatusBadge } from '@/components/badges';
import { BadgeCheckIcon, DocumentIcon, PauseIcon, StoreIcon } from '@/components/icons';
import { StatCard } from '@/components/stat-card';
import { formatPrice, formatQty, timeAgo } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { requireFarmerProfile } from '@/server/authz';

export default async function DashboardPage() {
  const { user, profile } = await requireFarmerProfile();

  const [products, recent, openRequests] = await Promise.all([
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
  ]);

  const active = products.filter((p) => p.status === 'ACTIVE' && p.moderation === 'APPROVED').length;
  const sold = products.filter((p) => p.status === 'SOLD').length;
  const paused = products.filter((p) => p.status === 'PAUSED').length;
  const pendingApproval = products.filter((p) => p.moderation === 'PENDING').length;

  const firstName = user.name.split(' ')[0];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {firstName} 👋</h1>
          <p className="text-muted">Here&apos;s what&apos;s happening with your farm today.</p>
        </div>
        <Link href="/dashboard/listings/new" className="btn ml-auto">+ Post produce</Link>
      </div>

      <Suspense>
        <ActionBanner
          messages={{
            posted: 'Listing posted — an admin will review it, usually the same day.',
            saved: 'Changes saved.',
          }}
        />
      </Suspense>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<StoreIcon />} label="Active listings" value={active} href="/dashboard/listings" />
        <StatCard icon={<BadgeCheckIcon />} label="Sold listings" value={sold} href="/dashboard/listings#lifecycle-SOLD_OUT" />
        <StatCard icon={<PauseIcon />} label="Paused listings" value={paused} href="/dashboard/listings#lifecycle-PAUSED" />
        <StatCard icon={<DocumentIcon />} label="Pending approval" value={pendingApproval} href="/dashboard/listings" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Recent Listings</h2>
            <Link href="/dashboard/listings" className="text-[12.5px] font-bold text-leaf-dark hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">You have not posted any produce yet.</p>
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

        <div className="card p-4">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Market Requests</h2>
            <Link href="/wanted" className="text-[12.5px] font-bold text-leaf-dark hover:underline">View all</Link>
          </div>
          <Link href="/wanted" className="mt-2 flex items-center gap-3 rounded-[10px] border border-line p-3 hover:bg-paper">
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
