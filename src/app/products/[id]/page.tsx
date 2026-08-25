import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusBadge, VerifiedBadge } from '@/components/badges';
import { ContactPrompt } from '@/components/contact-prompt';
import { PriceQuantity } from '@/components/quantity-bar';
import { ProductGallery } from '@/components/product-gallery';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { formatQty, telLink, timeAgo, whatsappProductLink } from '@/lib/format';
import { getProduct } from '@/server/queries';
import { currentUser } from '@/server/authz';
import { reportProduct, toggleFavorite } from '@/server/actions/products';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const p = await getProduct(params.id);
  if (!p) notFound();

  const user = await currentUser();

  return (
    <>
      <Link href="/" className="btn-ghost mb-4">← Back to marketplace</Link>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <ProductGallery images={p.images} name={p.name} emoji={p.category.emoji} />

          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">{p.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={p.status} />
            <span className="badge bg-paper text-muted">{p.category.name}</span>
            <span className="badge bg-paper text-muted">Listed {timeAgo(p.createdAt)}</span>
          </div>
          <p className="mt-3 text-[15px] text-muted">{p.description}</p>
        </div>

        <div>
          <div className="card mb-3.5 p-4">
            <PriceQuantity
              priceMinor={p.priceMinor}
              unit={p.unit}
              quantity={String(p.quantity)}
              initialQty={String(p.initialQty)}
            />

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
            <div className="my-3"><VerifiedBadge status={p.farmer.verification} /></div>
            <p className="text-sm text-muted">{p.farmer.description}</p>
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
