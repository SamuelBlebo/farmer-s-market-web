import Image from 'next/image';
import Link from 'next/link';
import { AdminResetPasswordButton } from '@/components/admin-reset-password-button';
import { ModerationBadge, StatusBadge, VerifiedBadge } from '@/components/badges';
import { CategoryIcon } from '@/components/category-icon';
import { ChartIcon, ChatIcon, GearIcon, PlusIcon, StarIcon } from '@/components/icons';
import { Pagination } from '@/components/pagination';
import { formatPrice, lastActiveLabel } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/server/authz';
import { getAdminBuyers, getAdminFarmers, getAdminProducts } from '@/server/queries';
import {
  moderateProduct,
  moderateReview,
  moderateWanted,
  removeProduct,
  resolveReport,
  setFarmerVerification,
  toggleCategory,
  upsertCategory,
} from '@/server/actions/admin';

type AdminSearchParams = { listingsPage?: string; farmersPage?: string; buyersPage?: string };

export default async function AdminPage({ searchParams }: { searchParams: AdminSearchParams }) {
  await requireAdmin();

  const listingsPage = Number(searchParams.listingsPage ?? 1) || 1;
  const farmersPage = Number(searchParams.farmersPage ?? 1) || 1;
  const buyersPage = Number(searchParams.buyersPage ?? 1) || 1;

  const [pending, pendingWanted, pendingReviews, farmers, buyers, allListings, reports, categories, counts] = await Promise.all([
    prisma.product.findMany({
      where: { moderation: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: { farmer: true, category: true },
      take: 50,
    }),
    prisma.wantedListing.findMany({
      where: { moderation: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: { buyer: true },
      take: 50,
    }),
    prisma.review.findMany({
      where: { moderation: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: { farmer: { select: { farmName: true } }, buyer: { select: { name: true, buyerProfile: { select: { businessName: true } } } } },
      take: 50,
    }),
    getAdminFarmers(farmersPage),
    getAdminBuyers(buyersPage),
    getAdminProducts(listingsPage),
    prisma.report.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      include: { product: true, reporter: { select: { name: true } } },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.$transaction([
      prisma.user.count({ where: { role: 'FARMER' } }),
      prisma.user.count({ where: { role: 'BUYER' } }),
      prisma.product.count({ where: { status: { not: 'REMOVED' } } }),
      prisma.report.count({ where: { status: 'OPEN' } }),
    ]),
  ]);

  const [farmerCount, buyerCount, productCount, reportCount] = counts;
  const stat = (n: number, l: string, href: string, tone = '') => (
    <Link href={href} className="card block p-4 transition-colors hover:border-[#B9CCBD]">
      <div className={`font-num text-2xl font-bold ${tone}`}>{n}</div>
      <p className="text-[13px] text-muted">{l}</p>
    </Link>
  );

  return (
    <>
      <div className="mb-4 mt-1 flex flex-wrap items-center gap-3">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="text-2xl font-bold tracking-tight">Platform overview</h1>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link href="/admin/analytics" className="btn-ghost inline-flex items-center gap-1.5">
            <ChartIcon className="h-4 w-4" /> Analytics
          </Link>
          <Link href="/admin/feedback" className="btn-ghost inline-flex items-center gap-1.5">
            <ChatIcon className="h-4 w-4" /> Feedback
          </Link>
          <Link href="/admin/system" className="btn-ghost inline-flex items-center gap-1.5">
            <GearIcon className="h-4 w-4" /> System
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stat(farmerCount, 'Farmers', '#farmer-verification')}
        {stat(buyerCount, 'Buyers', '#buyers')}
        {stat(productCount, 'Listings', '#all-listings')}
        {stat(reportCount, 'Reports open', '#reported-listings', 'text-clay')}
      </div>

      <h2 className="mb-2 text-lg font-semibold tracking-tight">Listings awaiting approval</h2>
      <div className="card mb-6 divide-y divide-line">
        {pending.length === 0 && <p className="p-5 text-sm text-muted">Nothing in the queue. All caught up.</p>}
        {pending.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 p-3.5">
            <CategoryIcon slug={p.category.slug} className="h-5 w-5 shrink-0 text-muted" />
            <div className="min-w-[160px] flex-1">
              <div className="font-bold">{p.name}</div>
              <div className="text-[12.5px] text-muted">
                {p.farmer.farmName} · {formatPrice(p.priceMinor)} / {p.unit} · {p.town}
              </div>
            </div>
            <Link href={`/admin/products/${p.id}/edit`} className="btn-ghost !px-3 !py-1.5 !text-[13px]">Edit</Link>
            <form action={moderateProduct} className="flex gap-2">
              <input type="hidden" name="productId" value={p.id} />
              <button name="decision" value="APPROVED" className="btn !px-3 !py-1.5 !text-[13px]">Approve</button>
              <button name="decision" value="REJECTED" className="btn-ghost !px-3 !py-1.5 !text-[13px]">Reject</button>
            </form>
          </div>
        ))}
      </div>

      <h2 id="buyer-requests" className="mb-2 scroll-mt-4 text-lg font-semibold tracking-tight">Buyer requests awaiting approval</h2>
      <div className="card mb-6 divide-y divide-line">
        {pendingWanted.length === 0 && <p className="p-5 text-sm text-muted">Nothing in the queue. All caught up.</p>}
        {pendingWanted.map((w) => (
          <div key={w.id} className="flex flex-wrap items-center gap-3 p-3.5">
            <div className="min-w-[160px] flex-1">
              <div className="font-bold">{w.productName}</div>
              <div className="text-[12.5px] text-muted">
                {w.buyer.businessName} · {w.quantity} · {w.town}, {w.region}
              </div>
            </div>
            <form action={moderateWanted} className="flex gap-2">
              <input type="hidden" name="wantedId" value={w.id} />
              <button name="decision" value="APPROVED" className="btn !px-3 !py-1.5 !text-[13px]">Approve</button>
              <button name="decision" value="REJECTED" className="btn-ghost !px-3 !py-1.5 !text-[13px]">Reject</button>
            </form>
          </div>
        ))}
      </div>

      <h2 id="pending-reviews" className="mb-2 scroll-mt-4 text-lg font-semibold tracking-tight">Reviews awaiting approval</h2>
      <div className="card mb-6 divide-y divide-line">
        {pendingReviews.length === 0 && <p className="p-5 text-sm text-muted">Nothing in the queue. All caught up.</p>}
        {pendingReviews.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 p-3.5">
            <div className="min-w-[200px] flex-1">
              <div className="font-bold">
                {r.rating}/5 · {r.buyer.buyerProfile?.businessName ?? r.buyer.name} → {r.farmer.farmName}
              </div>
              {r.comment && <div className="text-[12.5px] text-muted">{r.comment}</div>}
            </div>
            <form action={moderateReview} className="flex gap-2">
              <input type="hidden" name="reviewId" value={r.id} />
              <button name="decision" value="APPROVED" className="btn !px-3 !py-1.5 !text-[13px]">Approve</button>
              <button name="decision" value="REJECTED" className="btn-ghost !px-3 !py-1.5 !text-[13px]">Reject</button>
            </form>
          </div>
        ))}
      </div>

      <div className="mb-2 flex items-center gap-2">
        <h2 id="all-listings" className="scroll-mt-4 text-lg font-semibold tracking-tight">All listings</h2>
        <Link href="/admin/listings/new" className="ml-auto btn-ghost inline-flex items-center gap-1.5 !px-3 !py-1.5 !text-[13px]">
          <PlusIcon className="h-3.5 w-3.5" /> Post for a farmer
        </Link>
      </div>
      <div className="card mb-1 divide-y divide-line">
        {allListings.items.map((p) => {
          const thumb = p.images[0]?.url;
          return (
            <div key={p.id} className="flex flex-wrap items-center gap-3 p-3.5">
              <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[8px] bg-gradient-to-br from-[#E9F1E9] to-[#D6E5D8] text-lg">
                {thumb ? (
                  <Image src={thumb} alt="" fill sizes="40px" className="object-cover" />
                ) : (
                  <CategoryIcon slug={p.category.slug} className="h-5 w-5 text-leaf-dark/70" />
                )}
              </div>
              <div className="min-w-[160px] flex-1">
                <div className="font-bold">{p.name}</div>
                <div className="text-[12.5px] text-muted">{p.farmer.farmName} · {formatPrice(p.priceMinor)} / {p.unit}</div>
              </div>
              {p.featured && (
                <span aria-label="Featured" title="Featured">
                  <StarIcon className="h-4 w-4 text-[#8A6100]" filled />
                </span>
              )}
              <StatusBadge status={p.status} />
              <ModerationBadge status={p.moderation} />
              <Link href={`/admin/products/${p.id}/edit`} className="btn-ghost !px-3 !py-1.5 !text-[13px]">Edit</Link>
            </div>
          );
        })}
      </div>
      <Pagination page={allListings.page} pages={allListings.pages} basePath="/admin" searchParams={searchParams} pageParam="listingsPage" />

      <div className="mb-2 mt-8 flex items-center gap-2">
        <h2 id="farmer-verification" className="scroll-mt-4 text-lg font-semibold tracking-tight">Farmer verification</h2>
        <Link href="/admin/farmers/new" className="ml-auto btn-ghost inline-flex items-center gap-1.5 !px-3 !py-1.5 !text-[13px]">
          <PlusIcon className="h-3.5 w-3.5" /> Add farmer
        </Link>
      </div>
      <div className="card mb-1 divide-y divide-line">
        {farmers.items.map((f) => (
          <div key={f.id} className="flex flex-wrap items-center gap-3 p-3.5">
            <div className="min-w-[160px] flex-1">
              <div className="font-bold">{f.farmName}</div>
              <div className="text-[12.5px] text-muted">
                {f.town}, {f.region} · {f.phone} · {lastActiveLabel(f.user.lastActiveAt)}
                {f.reviewCount > 0 && (
                  <span className="inline-flex items-center gap-0.5">
                    {' · '}<StarIcon className="h-3 w-3 text-gold" filled /> {f.rating.toFixed(1)} ({f.reviewCount})
                  </span>
                )}
              </div>
            </div>
            <VerifiedBadge status={f.verification} precise />
            <form action={setFarmerVerification} className="flex gap-2">
              <input type="hidden" name="farmerId" value={f.id} />
              {f.verification !== 'VERIFIED' ? (
                <button name="status" value="VERIFIED" className="btn !px-3 !py-1.5 !text-[13px]">Mark verified</button>
              ) : (
                <button name="status" value="UNVERIFIED" className="btn-ghost !px-3 !py-1.5 !text-[13px]">Remove badge</button>
              )}
            </form>
            <AdminResetPasswordButton userId={f.userId} />
          </div>
        ))}
      </div>
      <Pagination page={farmers.page} pages={farmers.pages} basePath="/admin" searchParams={searchParams} pageParam="farmersPage" />

      <h2 id="buyers" className="mb-2 mt-8 scroll-mt-4 text-lg font-semibold tracking-tight">Buyers</h2>
      <div className="card mb-1 divide-y divide-line">
        {buyers.items.length === 0 && <p className="p-5 text-sm text-muted">No buyers yet.</p>}
        {buyers.items.map((b) => (
          <div key={b.id} className="flex flex-wrap items-center gap-3 p-3.5">
            <div className="min-w-[160px] flex-1">
              <div className="font-bold">{b.businessName}</div>
              <div className="text-[12.5px] text-muted">
                {b.town}, {b.region} · {b.phone} · {lastActiveLabel(b.user.lastActiveAt)}
              </div>
            </div>
            <AdminResetPasswordButton userId={b.userId} />
          </div>
        ))}
      </div>
      <Pagination page={buyers.page} pages={buyers.pages} basePath="/admin" searchParams={searchParams} pageParam="buyersPage" />

      <h2 id="reported-listings" className="mb-2 mt-8 scroll-mt-4 text-lg font-semibold tracking-tight">Reported listings</h2>
      <div className="card mb-6 divide-y divide-line">
        {reports.length === 0 && <p className="p-5 text-sm text-muted">No open reports.</p>}
        {reports.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 p-3.5">
            <div className="min-w-[200px] flex-1">
              <div className="font-bold">{r.product.name}</div>
              <div className="text-[12.5px] text-muted">{r.reason} — reported by {r.reporter.name}</div>
            </div>
            <Link href={`/admin/products/${r.productId}/edit`} className="btn-ghost !px-3 !py-1.5 !text-[13px]">Edit</Link>
            <form action={resolveReport}>
              <input type="hidden" name="reportId" value={r.id} />
              <button name="status" value="DISMISSED" className="btn-ghost !px-3 !py-1.5 !text-[13px]">Dismiss</button>
            </form>
            <form action={removeProduct}>
              <input type="hidden" name="productId" value={r.productId} />
              <button className="btn-ghost !px-3 !py-1.5 !text-[13px]">Remove listing</button>
            </form>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-lg font-semibold tracking-tight">Categories</h2>
      <div className="card divide-y divide-line">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3.5">
            <CategoryIcon slug={c.slug} className="h-5 w-5 text-muted" />
            <span className="flex-1 font-bold">{c.name}</span>
            <span className="text-[12.5px] text-muted">{c.active ? 'Visible' : 'Hidden'}</span>
            <form action={toggleCategory}>
              <input type="hidden" name="categoryId" value={c.id} />
              <button className="btn-ghost !px-3 !py-1.5 !text-[13px]">{c.active ? 'Hide' : 'Show'}</button>
            </form>
          </div>
        ))}
        <form action={upsertCategory} className="flex flex-wrap items-end gap-2 p-3.5">
          <label className="flex-1">
            <span className="label">Add a category</span>
            <input name="name" className="input" placeholder="e.g. Spices" required />
          </label>
          <label className="w-24">
            <span className="label">Emoji</span>
            <input name="emoji" className="input" placeholder="🌶️" />
          </label>
          <button className="btn">Add</button>
        </form>
      </div>
    </>
  );
}
