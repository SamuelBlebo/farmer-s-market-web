import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ActionBanner } from '@/components/action-banner';
import { DeleteListingForm } from '@/components/delete-listing-form';
import { StatusBadge, VerifiedBadge } from '@/components/badges';
import { formatPrice, formatQty, timeAgo } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { requireFarmerProfile } from '@/server/authz';
import { deleteProduct, setProductStatus } from '@/server/actions/products';

export default async function DashboardPage() {
  const { profile } = await requireFarmerProfile();

  const products = await prisma.product.findMany({
    where: { farmerId: profile.id, status: { not: 'REMOVED' } },
    orderBy: { createdAt: 'desc' },
    include: { category: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
  });

  const active = products.filter((p) => p.status === 'ACTIVE' && p.moderation === 'APPROVED').length;
  const sold = products.filter((p) => p.status === 'SOLD').length;
  const paused = products.filter((p) => p.status === 'PAUSED').length;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <p className="eyebrow">Farmer dashboard</p>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">{profile.farmName}</h1>
            <VerifiedBadge status={profile.verification} />
          </div>
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
        <div className="card p-4">
          <div className="font-num text-2xl font-bold">{products.length}</div>
          <p className="text-[13px] text-muted">Total listings</p>
        </div>
        <div className="card p-4">
          <div className="font-num text-2xl font-bold">{active}</div>
          <p className="text-[13px] text-muted">Active listings</p>
        </div>
        <div className="card p-4">
          <div className="font-num text-2xl font-bold">{sold}</div>
          <p className="text-[13px] text-muted">Sold listings</p>
        </div>
        <div className="card p-4">
          <div className="font-num text-2xl font-bold">{paused}</div>
          <p className="text-[13px] text-muted">Paused listings</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-bold">You have not posted any produce yet.</p>
          <p className="mt-1 text-sm text-muted">It takes about a minute — name, price, quantity, a photo.</p>
          <Link href="/dashboard/listings/new" className="btn mt-4">Post your first listing</Link>
        </div>
      ) : (
        <div className="card divide-y divide-line">
          {products.map((p) => {
            const thumb = p.images[0]?.url;
            return (
              <div key={p.id} className="flex flex-wrap items-center gap-3 p-3.5">
                <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-gradient-to-br from-[#E9F1E9] to-[#D6E5D8] text-xl">
                  {thumb ? (
                    <Image src={thumb} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <span aria-hidden>{p.category.emoji ?? '🌿'}</span>
                  )}
                </div>
                <div className="min-w-[160px] flex-1">
                  <div className="font-bold">{p.name}</div>
                  <div className="text-[12.5px] text-muted">
                    {formatPrice(p.priceMinor)} / {p.unit} · {formatQty(String(p.quantity))} left · {timeAgo(p.createdAt)}
                  </div>
                </div>

                {p.moderation === 'PENDING' && <span className="badge bg-gold-light text-[#8A6100]">Awaiting approval</span>}
                {p.moderation === 'REJECTED' && <span className="badge bg-clay-light text-clay">Rejected</span>}
                <StatusBadge status={p.status} />

                <div className="flex flex-wrap gap-2">
                  <Link href={`/dashboard/listings/${p.id}/edit`} className="btn-ghost !px-3 !py-1.5 !text-[13px]">Edit</Link>
                  <form action={setProductStatus}>
                    <input type="hidden" name="productId" value={p.id} />
                    <input type="hidden" name="status" value={p.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'} />
                    <button className="btn-ghost !px-3 !py-1.5 !text-[13px]">
                      {p.status === 'ACTIVE' ? 'Pause' : 'Unpause'}
                    </button>
                  </form>
                  {p.status !== 'SOLD' && (
                    <form action={setProductStatus}>
                      <input type="hidden" name="productId" value={p.id} />
                      <input type="hidden" name="status" value="SOLD" />
                      <button className="btn-ghost !px-3 !py-1.5 !text-[13px]">Mark sold</button>
                    </form>
                  )}
                  <DeleteListingForm productId={p.id} action={deleteProduct} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
