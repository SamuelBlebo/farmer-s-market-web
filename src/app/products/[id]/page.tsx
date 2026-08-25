import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LifecycleBadge, StatusBadge, VerifiedBadge } from '@/components/badges';
import { ContactPrompt } from '@/components/contact-prompt';
import { PriceQuantity } from '@/components/quantity-bar';
import { ProductGallery } from '@/components/product-gallery';
import { WhatsAppButton } from '@/components/whatsapp-button';
import {
  formatPrice,
  formatQty,
  getProductLifecycle,
  harvestLabel,
  lastActiveLabel,
  telLink,
  timeAgo,
  whatsappProductLink,
} from '@/lib/format';
import { getProduct } from '@/server/queries';
import { currentUser } from '@/server/authz';
import { reportProduct, toggleFavorite } from '@/server/actions/products';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const p = await getProduct(params.id);
  if (!p) notFound();

  const user = await currentUser();
  const lifecycle = getProductLifecycle(p.status, p.expectedHarvestDate);

  return (
    <>
      <Link href="/" className="btn-ghost mb-4">← Back to marketplace</Link>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <ProductGallery images={p.images} name={p.name} emoji={p.category.emoji} />

          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">{p.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={p.status} />
            {lifecycle !== 'ONGOING' && <LifecycleBadge lifecycle={lifecycle} />}
            <span className="badge bg-paper text-muted">{p.category.name}</span>
            <span className="badge bg-paper text-muted">Listed {timeAgo(p.createdAt)}</span>
          </div>
          {p.status === 'ACTIVE' && (
            <p className="mt-2 text-sm font-semibold text-muted">🌾 {harvestLabel(p.expectedHarvestDate)}</p>
          )}
          <p className="mt-3 text-[15px] text-muted">{p.description}</p>
        </div>

        <div>
          <div className="card mb-3.5 p-4">
            <PriceQuantity
              priceMinor={p.priceMinor}
              unit={p.unit}
              quantity={String(p.quantity)}
              initialQty={String(p.initialQty)}
              fromPrice={p.variants[0]?.priceMinor}
            />

            {p.variants.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-line pt-3">
                <p className="eyebrow">Choose a variant</p>
                {p.variants.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-sm">
                    <span>{v.name}{v.quantity ? ` · ${formatQty(String(v.quantity))} ${p.unit}` : ''}</span>
                    <span className="font-num font-bold">{formatPrice(v.priceMinor)}</span>
                  </div>
                ))}
              </div>
            )}

            <dl className="mt-4 text-sm">
              <div className="flex justify-between border-b border-line py-2">
                <dt className="text-muted">Quantity available</dt>
                <dd className="font-bold">{formatQty(String(p.quantity))} {p.unit}</dd>
              </div>
              <div className="flex justify-between border-b border-line py-2">
                <dt className="text-muted">Location</dt>
                <dd className="font-bold">{p.town}, {p.region}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-muted">Category</dt>
                <dd className="font-bold">{p.category.name}</dd>
              </div>
            </dl>

            {p.status === 'ACTIVE' ? (
              user ? (
                <div className="mt-4 space-y-2">
                  <WhatsAppButton href={whatsappProductLink(p.farmer.whatsapp, p.name)} className="w-full" />
                  {p.farmer.phone && (
                    <a href={telLink(p.farmer.phone)} className="btn-ghost w-full">📞 Call farmer</a>
                  )}
                </div>
              ) : (
                <ContactPrompt message="Sign in to contact this farmer." className="mt-4" />
              )
            ) : (
              <p className="mt-4 rounded-[10px] bg-paper p-3 text-center text-sm text-muted">
                This listing is {p.status.toLowerCase()}. Browse the marketplace for what is available now.
              </p>
            )}

            {user && (
              <form action={toggleFavorite} className="mt-2">
                <input type="hidden" name="productId" value={p.id} />
                <button className="btn-ghost w-full">♡ Save listing</button>
              </form>
            )}
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-leaf-light font-extrabold text-leaf-dark">
                {p.farmer.farmName[0]}
              </div>
              <div>
                <div className="font-bold">{p.farmer.farmName}</div>
                <div className="text-[13px] text-muted">{p.farmer.town}, {p.farmer.region}</div>
              </div>
            </div>
            <div className="my-3"><VerifiedBadge status={p.farmer.verification} large /></div>
            <p className="text-sm text-muted">{p.farmer.description}</p>
            <dl className="mt-3 border-t border-line pt-3 text-[12.5px] text-muted">
              <div className="flex justify-between py-1">
                <dt>Member since</dt>
                <dd className="font-semibold">{p.farmer.createdAt.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt>Active listings</dt>
                <dd className="font-semibold">{p.farmer._count.products}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt>Activity</dt>
                <dd className="font-semibold">{lastActiveLabel(p.farmer.user.lastActiveAt)}</dd>
              </div>
            </dl>
            <Link href={`/farmers/${p.farmer.id}`} className="btn-ghost mt-3 w-full">View farmer profile</Link>
          </div>

          {user && (
            <form action={reportProduct} className="card mt-3 p-4">
              <input type="hidden" name="productId" value={p.id} />
              <label className="label" htmlFor="reason">Something wrong with this listing?</label>
              <input id="reason" name="reason" className="input" placeholder="e.g. price is wrong, farmer not responding" required />
              <button className="btn-ghost mt-2 w-full">⚑ Report listing</button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
