import Link from 'next/link';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { whatsappWantedLink } from '@/lib/format';
import { getWanted } from '@/server/queries';
import { currentUser } from '@/server/authz';

export default async function WantedPage() {
  const [listings, user] = await Promise.all([getWanted(), currentUser()]);

  return (
    <>
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <div>
          <p className="eyebrow">Buyers looking for produce</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Wanted</h1>
        </div>
        {(!user || user.role === 'BUYER') && (
          <Link href="/wanted/new" className="btn ml-auto !bg-clay hover:!brightness-95">+ Post a request</Link>
        )}
      </div>
      <p className="mb-4 text-muted">If you grow it, message the buyer directly.</p>

      {listings.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-bold">No open requests right now.</p>
          <p className="mt-1 text-sm text-muted">Buyers post here when they need produce in bulk.</p>
          {(!user || user.role === 'BUYER') && (
            <Link href="/wanted/new" className="btn mt-4">Post the first request</Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((w) => (
            <article key={w.id} className="card border-l-[3px] border-l-clay p-4">
              <p className="eyebrow text-clay">Wanted</p>
              <h2 className="mt-1 text-lg font-extrabold tracking-tight">{w.productName}</h2>
              <p className="font-num text-base font-bold">{w.quantity}</p>

              <dl className="my-3 text-sm">
                <div className="flex justify-between border-b border-line py-2">
                  <dt className="text-muted">Deliver to</dt>
                  <dd className="font-bold">{w.town}, {w.region}</dd>
                </div>
                <div className="flex justify-between border-b border-line py-2">
                  <dt className="text-muted">Needed by</dt>
                  <dd className="font-bold">
                    {w.neededBy ? w.neededBy.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Ongoing'}
                  </dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-muted">Buyer</dt>
                  <dd className="font-bold">{w.buyer.businessName}</dd>
                </div>
              </dl>

              <p className="text-[13.5px] text-muted">{w.description}</p>
              <WhatsAppButton
                href={whatsappWantedLink(w.buyer.whatsapp, w.productName)}
                label="Contact buyer"
                className="mt-3 w-full"
              />
            </article>
          ))}
        </div>
      )}
    </>
  );
}
