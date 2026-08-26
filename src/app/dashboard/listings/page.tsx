import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ToastListener } from '@/components/toast-listener';
import { DeleteListingForm } from '@/components/delete-listing-form';
import { LifecycleBadge } from '@/components/badges';
import {
  LIFECYCLE_LABEL,
  formatPrice,
  formatQty,
  getProductLifecycle,
  harvestLabel,
  timeAgo,
  type ProductLifecycle,
} from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { requireFarmerProfile } from '@/server/authz';
import { deleteProduct, setProductStatus } from '@/server/actions/products';
import type { Prisma } from '@prisma/client';

type Row = Prisma.ProductGetPayload<{ include: { category: true; images: { take: 1 } } }>;

const GROUP_ORDER: ProductLifecycle[] = ['UPCOMING_HARVEST', 'AVAILABLE_NOW', 'ONGOING', 'SOLD_OUT', 'PAUSED'];

function ProductRow({ p }: { p: Row }) {
  const thumb = p.images[0]?.url;
  return (
    <div className="flex flex-wrap items-center gap-3 p-3.5">
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
        {p.expectedHarvestDate && p.status === 'ACTIVE' && (
          <div className="text-[12.5px] text-muted">🌾 {harvestLabel(p.expectedHarvestDate)}</div>
        )}
      </div>

      {p.moderation === 'PENDING' && <span className="badge bg-gold-light text-[#8A6100]">Awaiting approval</span>}
      {p.moderation === 'REJECTED' && <span className="badge bg-clay-light text-clay">Rejected</span>}

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
}

export default async function MyListingsPage() {
  const { profile } = await requireFarmerProfile();

  const products = await prisma.product.findMany({
    where: { farmerId: profile.id, status: { not: 'REMOVED' } },
    orderBy: { createdAt: 'desc' },
    include: { category: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
  });

  const groups = new Map<ProductLifecycle, Row[]>();
  for (const p of products) {
    const lifecycle = getProductLifecycle(p.status, p.expectedHarvestDate);
    groups.set(lifecycle, [...(groups.get(lifecycle) ?? []), p]);
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <p className="eyebrow">Manage</p>
          <h1 className="text-2xl font-bold tracking-tight">My Listings</h1>
        </div>
        <Link href="/dashboard/listings/new" className="btn ml-auto">+ Post produce</Link>
      </div>

      <Suspense>
        <ToastListener
          messages={{
            posted: 'Listing posted — an admin will review it, usually the same day.',
            saved: 'Changes saved.',
          }}
        />
      </Suspense>

      {products.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-bold">You have not posted any produce yet.</p>
          <p className="mt-1 text-sm text-muted">It takes about a minute — name, price, quantity, a photo.</p>
          <Link href="/dashboard/listings/new" className="btn mt-4">Post your first listing</Link>
        </div>
      ) : (
        GROUP_ORDER.filter((lifecycle) => groups.has(lifecycle)).map((lifecycle) => (
          <div key={lifecycle} id={`lifecycle-${lifecycle}`} className="mb-5 scroll-mt-4">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">{LIFECYCLE_LABEL[lifecycle]}</h2>
              <LifecycleBadge lifecycle={lifecycle} />
              <span className="text-[12.5px] text-muted">{groups.get(lifecycle)!.length}</span>
            </div>
            <div className="card divide-y divide-line">
              {groups.get(lifecycle)!.map((p) => <ProductRow key={p.id} p={p} />)}
            </div>
          </div>
        ))
      )}
    </>
  );
}
