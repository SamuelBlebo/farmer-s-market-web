import { VerifiedBadge } from '@/components/badges';
import { formatPrice } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/server/authz';
import {
  moderateProduct,
  moderateWanted,
  removeProduct,
  resolveReport,
  setFarmerVerification,
  toggleCategory,
  upsertCategory,
} from '@/server/actions/admin';

export default async function AdminPage() {
  await requireAdmin();

  const [pending, pendingWanted, farmers, reports, categories, counts] = await Promise.all([
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
    prisma.farmerProfile.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
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
  const stat = (n: number, l: string, tone = '') => (
    <div className="card p-4">
      <div className={`font-num text-2xl font-bold ${tone}`}>{n}</div>
      <p className="text-[13px] text-muted">{l}</p>
    </div>
  );

  return (
    <>
      <p className="eyebrow">Admin</p>
      <h1 className="mb-4 mt-1 text-2xl font-extrabold tracking-tight">Platform overview</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stat(farmerCount, 'Farmers')}
        {stat(buyerCount, 'Buyers')}
        {stat(productCount, 'Listings')}
        {stat(reportCount, 'Reports open', 'text-clay')}
      </div>

      <h2 className="mb-2 text-lg font-extrabold tracking-tight">Listings awaiting approval</h2>
      <div className="card mb-6 divide-y divide-line">
        {pending.length === 0 && <p className="p-5 text-sm text-muted">Nothing in the queue. All caught up.</p>}
        {pending.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 p-3.5">
            <span className="text-xl" aria-hidden>{p.category.emoji}</span>
            <div className="min-w-[160px] flex-1">
              <div className="font-bold">{p.name}</div>
              <div className="text-[12.5px] text-muted">
                {p.farmer.farmName} · {formatPrice(p.priceMinor)} / {p.unit} · {p.town}
              </div>
            </div>
            <form action={moderateProduct} className="flex gap-2">
              <input type="hidden" name="productId" value={p.id} />
              <button name="decision" value="APPROVED" className="btn !px-3 !py-1.5 !text-[13px]">Approve</button>
              <button name="decision" value="REJECTED" className="btn-ghost !px-3 !py-1.5 !text-[13px]">Reject</button>
            </form>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-lg font-extrabold tracking-tight">Buyer requests awaiting approval</h2>
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

      <h2 className="mb-2 text-lg font-extrabold tracking-tight">Farmer verification</h2>
      <div className="card mb-6 divide-y divide-line">
        {farmers.map((f) => (
          <div key={f.id} className="flex flex-wrap items-center gap-3 p-3.5">
            <div className="min-w-[160px] flex-1">
              <div className="font-bold">{f.farmName}</div>
              <div className="text-[12.5px] text-muted">{f.town}, {f.region} · {f.phone}</div>
            </div>
            <VerifiedBadge status={f.verification} />
            <form action={setFarmerVerification} className="flex gap-2">
              <input type="hidden" name="farmerId" value={f.id} />
              {f.verification !== 'VERIFIED' ? (
                <button name="status" value="VERIFIED" className="btn !px-3 !py-1.5 !text-[13px]">Mark verified</button>
              ) : (
                <button name="status" value="UNVERIFIED" className="btn-ghost !px-3 !py-1.5 !text-[13px]">Remove badge</button>
              )}
            </form>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-lg font-extrabold tracking-tight">Reported listings</h2>
      <div className="card mb-6 divide-y divide-line">
        {reports.length === 0 && <p className="p-5 text-sm text-muted">No open reports.</p>}
        {reports.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 p-3.5">
            <div className="min-w-[200px] flex-1">
              <div className="font-bold">{r.product.name}</div>
              <div className="text-[12.5px] text-muted">{r.reason} — reported by {r.reporter.name}</div>
            </div>
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

      <h2 className="mb-2 text-lg font-extrabold tracking-tight">Categories</h2>
      <div className="card divide-y divide-line">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3.5">
            <span className="text-xl" aria-hidden>{c.emoji}</span>
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
