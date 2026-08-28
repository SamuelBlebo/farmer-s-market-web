import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LifecycleBadge, StatusBadge, VerifiedBadge } from '@/components/badges';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ChatButton } from '@/components/chat-button';
import { ContactPrompt } from '@/components/contact-prompt';
import { CheckIcon, EyeIcon, FlagIcon, PencilIcon, PinIcon, ShieldIcon, StarIcon, TruckIcon, WheatIcon } from '@/components/icons';
import { ProductCard } from '@/components/product-card';
import { PriceQuantity } from '@/components/quantity-bar';
import { ProductGallery } from '@/components/product-gallery';
import { RecordView } from '@/components/record-view';
import { StickyContactBar } from '@/components/sticky-contact-bar';
import { TrackedCallLink } from '@/components/tracked-call-link';
import { TrustScoreBadge } from '@/components/trust-score-badge';
import {
  formatPrice,
  formatQty,
  getProductLifecycle,
  harvestLabel,
  lastActiveLabel,
  telLink,
  timeAgo,
} from '@/lib/format';
import { PLATFORM_NAME } from '@/lib/constants';
import { computeTrustScore } from '@/lib/trust';
import { getFarmerRatingSummary, getFollowerCount, getProduct, getRelatedProducts, recordProductView } from '@/server/queries';
import { currentUser } from '@/server/authz';
import { reportProduct } from '@/server/actions/products';
import { track } from '@/server/analytics';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const p = await getProduct(params.id);
  if (!p) return {};

  const title = `${p.name} — ${formatPrice(p.priceMinor)}/${p.unit}`;
  const description = `${p.name} from ${p.farmer.farmName} in ${p.region}, Ghana.${p.description ? ` ${p.description}` : ''}`.slice(0, 160);
  // Only ever the listing's own real photo — no fabricated stand-in when there isn't one.
  const image = p.images[0]?.url;

  return {
    title,
    description,
    openGraph: { title, description, images: image ? [{ url: image }] : undefined },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const p = await getProduct(params.id);
  if (!p) notFound();

  const [user, followers, related, ratingSummary] = await Promise.all([
    currentUser(),
    getFollowerCount(p.farmer.user.id),
    getRelatedProducts({ id: p.id, categoryId: p.categoryId, region: p.region }),
    getFarmerRatingSummary(p.farmer.id),
  ]);
  // Recently Viewed is a buyer/admin feature — farmers don't get it, so don't bother recording for them.
  if (user && user.role !== 'FARMER') await recordProductView(user.id, p.id);
  // Fire-and-forget — never await analytics from a page render.
  void track({ type: 'PRODUCT_VIEWED', userId: user?.id, entityId: p.id });

  const lifecycle = getProductLifecycle(p.status, p.expectedHarvestDate);
  const trustScore = computeTrustScore({
    verification: p.farmer.verification,
    lastActiveAt: p.farmer.user.lastActiveAt,
    activeListings: p.farmer._count.products,
    followers,
    memberSince: p.farmer.createdAt,
  });

  return (
    <>
      {(!user || user.role !== 'FARMER') && <RecordView productId={p.id} />}
      <Breadcrumbs
        items={[
          { label: 'Marketplace', href: '/' },
          { label: p.category.name, href: `/?category=${p.category.slug}` },
          { label: p.name },
        ]}
      />

      {user?.role === 'ADMIN' && (
        <div className="mb-4 flex items-center justify-between rounded-[10px] border border-line bg-paper px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted">
            <EyeIcon className="h-4 w-4" /> Viewing as admin
          </span>
          <Link href={`/admin/products/${p.id}/edit`} className="btn-ghost inline-flex items-center gap-1.5 !px-3 !py-1.5 !text-[13px]">
            <PencilIcon className="h-3.5 w-3.5" /> Edit listing
          </Link>
        </div>
      )}

      {/* grid-cols-1 pins an explicit, fully-stretched single track below lg —
          plain "grid" with no column count left grid-template-columns: none
          on mobile, whose implicit auto-sized track shrinks to fit content
          instead of filling the viewport, unlike normal block layout. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <ProductGallery images={p.images} name={p.name} categorySlug={p.category.slug} productId={user ? p.id : undefined} />

          {user && p.status === 'ACTIVE' && (
            <StickyContactBar
              farmerUserId={user.role === 'BUYER' ? p.farmer.user.id : null}
              telHref={p.farmer.phone ? telLink(p.farmer.phone) : null}
              productId={p.id}
            />
          )}

          {/* Listing details — name, price, specs, and delivery together in one card. */}
          <div className="card mt-5 p-4">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold leading-snug tracking-tight sm:text-2xl">{p.name}</h1>
              <div className="shrink-0 whitespace-nowrap text-right font-num text-lg font-bold tracking-tight sm:text-xl">
                {p.variants[0]?.priceMinor !== undefined ? (
                  <>
                    <span className="block font-sans text-[11px] font-semibold text-muted">From</span>
                    {formatPrice(p.variants[0].priceMinor)}
                  </>
                ) : (
                  formatPrice(p.priceMinor)
                )}
                <span className="ml-1 font-sans text-xs font-semibold text-muted">/{p.unit}</span>
              </div>
            </div>

            <p className="mt-3 text-[15px] leading-relaxed text-muted">{p.description}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {lifecycle === 'AVAILABLE_NOW' && (
                <span className="badge bg-leaf-light text-leaf-dark">
                  <span className="h-1.5 w-1.5 rounded-full bg-leaf-dark" aria-hidden /> Available Now
                </span>
              )}
              {lifecycle === 'UPCOMING_HARVEST' && (
                <span className="badge bg-gold-light text-[#8A6100]">
                  <WheatIcon className="h-3 w-3" /> {harvestLabel(p.expectedHarvestDate)}
                </span>
              )}
              {p.deliveryAvailable ? (
                <span className="badge bg-leaf-light text-leaf-dark">
                  <TruckIcon className="h-3 w-3" /> Delivery Available
                </span>
              ) : (
                <span className="badge bg-paper text-muted">
                  <PinIcon className="h-3 w-3" /> Pickup Only
                </span>
              )}
              {p.farmer.verification === 'VERIFIED' && (
                <span className="badge bg-leaf-light text-leaf-dark">
                  <CheckIcon className="h-3 w-3" /> Verified Farmer
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge status={p.status} />
              {lifecycle !== 'ONGOING' && <LifecycleBadge lifecycle={lifecycle} />}
              <span className="badge bg-paper text-muted">{p.category.name}</span>
              <span className="badge bg-paper text-muted">Listed {timeAgo(p.createdAt)}</span>
            </div>
            {p.status === 'ACTIVE' && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-muted">
                <WheatIcon className="h-4 w-4" /> {harvestLabel(p.expectedHarvestDate)}
              </p>
            )}

            <div className="mt-4 border-t border-line pt-4">
              <PriceQuantity
                priceMinor={p.priceMinor}
                unit={p.unit}
                quantity={String(p.quantity)}
                initialQty={String(p.initialQty)}
                fromPrice={p.variants[0]?.priceMinor}
                hidePrice
              />
            </div>

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

            <dl className="mt-4 border-t border-line pt-4 text-sm">
              <div className="flex justify-between border-b border-line py-2">
                <dt className="text-muted">Quantity available</dt>
                <dd className="font-bold">{formatQty(String(p.quantity))} {p.unit}</dd>
              </div>
              <div className="flex justify-between border-b border-line py-2">
                <dt className="text-muted">Location</dt>
                <dd className="font-bold">{p.town}, {p.region}</dd>
              </div>
              <div className="flex justify-between border-b border-line py-2">
                <dt className="text-muted">Category</dt>
                <dd className="font-bold">{p.category.name}</dd>
              </div>
              {p.deliveryAvailable ? (
                <>
                  <div className="flex justify-between border-b border-line py-2">
                    <dt className="text-muted">Delivery</dt>
                    <dd>
                      <span className="badge bg-leaf-light text-leaf-dark">
                        <TruckIcon className="h-3 w-3" /> Available
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-muted">Delivery cost</dt>
                    <dd className="text-right font-bold">
                      {p.deliveryPaidBy === 'FARMER' ? 'Free — farmer delivers' : 'Buyer pays — arrange the cost on WhatsApp'}
                    </dd>
                  </div>
                </>
              ) : (
                <div className="flex justify-between py-2">
                  <dt className="text-muted">Delivery</dt>
                  <dd className="font-bold">Pickup only</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div>
          {/* Farmer + contact — who's selling it and how to reach them, together in one card. */}
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-leaf-light font-extrabold text-leaf-dark">
                {p.farmer.farmName[0]}
              </div>
              <div className="min-w-0">
                <div className="truncate font-bold">{p.farmer.farmName}</div>
                <div className="truncate text-[13px] text-muted">{p.farmer.town}, {p.farmer.region}</div>
              </div>
            </div>
            <div className="my-3 flex flex-wrap items-center gap-1.5">
              <VerifiedBadge status={p.farmer.verification} large />
              <TrustScoreBadge score={trustScore} />
              {ratingSummary.count > 0 && (
                <span className="badge bg-gold-light text-[#8A6100]">
                  <StarIcon className="h-3.5 w-3.5" filled /> {ratingSummary.average.toFixed(1)} ({ratingSummary.count})
                </span>
              )}
            </div>
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

            <div className="mt-4 border-t border-line pt-4">
              {p.status === 'ACTIVE' ? (
                user ? (
                  <div className="flex gap-2">
                    {user.role === 'BUYER' && (
                      <ChatButton otherUserId={p.farmer.user.id} productId={p.id} label="Chat with farmer" className="btn flex-1" />
                    )}
                    {p.farmer.phone && (
                      <TrackedCallLink href={telLink(p.farmer.phone)} productId={p.id} className="btn-ghost flex-1" />
                    )}
                  </div>
                ) : (
                  <ContactPrompt message="Sign in to contact this farmer." />
                )
              ) : (
                <p className="rounded-[10px] bg-paper p-3 text-center text-sm text-muted">
                  This listing is {p.status.toLowerCase()}. Browse the marketplace for what is available now.
                </p>
              )}
            </div>
          </div>

          <div className="card mt-3.5 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-bold">
              <ShieldIcon className="h-4 w-4 text-leaf-dark" /> Safety tips
            </p>
            <ul className="list-disc space-y-1.5 pl-4 text-[13px] text-muted marker:text-leaf-dark">
              <li>Inspect the produce before you pay — quality can vary by harvest.</li>
              <li>Meet at the farm or an agreed public location for pickup.</li>
              <li>Avoid sending full payment upfront to someone you haven&apos;t dealt with before.</li>
              <li>{PLATFORM_NAME} never processes payments — always pay the farmer directly, only when satisfied.</li>
            </ul>
          </div>

          {user && (
            <form action={reportProduct} className="card mt-3.5 p-4">
              <input type="hidden" name="productId" value={p.id} />
              <label className="label" htmlFor="reason">Something wrong with this listing?</label>
              <input id="reason" name="reason" className="input" placeholder="e.g. price is wrong, farmer not responding" required />
              <button className="btn-ghost mt-2 inline-flex w-full items-center justify-center gap-1.5">
                <FlagIcon className="h-4 w-4" /> Report listing
              </button>
            </form>
          )}
        </div>
      </div>

      {related.length >= 2 && (
        <div className="mt-8">
          <h2 className="eyebrow mb-2">People also viewed</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {related.map((rp) => <ProductCard key={rp.id} p={rp} />)}
          </div>
        </div>
      )}
    </>
  );
}
