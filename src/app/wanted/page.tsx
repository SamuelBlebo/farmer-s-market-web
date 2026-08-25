import { Suspense } from 'react';
import Link from 'next/link';
import { ActionBanner } from '@/components/action-banner';
import { ModerationBadge } from '@/components/badges';
import { ContactPrompt } from '@/components/contact-prompt';
import { BadgeCheckIcon, CalendarIcon, ClockIcon, DocumentIcon, PinIcon, StoreIcon } from '@/components/icons';
import { Pagination } from '@/components/pagination';
import { StatCard } from '@/components/stat-card';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { timeAgo, whatsappWantedLink } from '@/lib/format';
import { getMyWanted, getWanted } from '@/server/queries';
import { currentUser } from '@/server/authz';
import { closeWanted } from '@/server/actions/wanted';

export default async function WantedPage({ searchParams }: { searchParams: { page?: string } }) {
  const user = await currentUser();
  const [{ items: listings, page, pages }, mine] = await Promise.all([
    getWanted(Number(searchParams.page ?? 1) || 1),
    user?.role === 'BUYER' ? getMyWanted(user.id) : Promise.resolve([]),
  ]);

  return (
    <>
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <div>
          <p className="eyebrow">Buyers looking for produce</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Requests</h1>
        </div>
        {(!user || user.role === 'BUYER') && (
          <Link href="/wanted/new" className="btn ml-auto !bg-clay hover:!brightness-95">+ Post a request</Link>
        )}
      </div>
      <p className="mb-4 text-muted">If you grow it, message the buyer directly.</p>

      <Suspense>
        <ActionBanner messages={{ posted: 'Request submitted — an admin will review it shortly.' }} />
      </Suspense>

      {user?.role === 'BUYER' && mine.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-[15px] font-bold">Welcome back, {user.name.split(' ')[0]} 👋</p>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <StatCard
              icon={<DocumentIcon />}
              label="Open requests"
              value={mine.filter((w) => w.status === 'OPEN' && w.moderation === 'APPROVED').length}
            />
            <StatCard
              icon={<ClockIcon />}
              label="Pending review"
              value={mine.filter((w) => w.moderation === 'PENDING').length}
            />
            <StatCard
              icon={<BadgeCheckIcon />}
              label="Closed requests"
              value={mine.filter((w) => w.status === 'CLOSED').length}
            />
          </div>
          <h2 className="mb-2 text-lg font-extrabold tracking-tight">Your requests</h2>
          <div className="card divide-y divide-line">
            {mine.map((w) => (
              <div key={w.id} className="flex flex-wrap items-center gap-3 p-3.5">
                <div className="min-w-[160px] flex-1">
                  <div className="font-bold">{w.productName}</div>
                  <div className="text-[12.5px] text-muted">{w.quantity} · {w.town}, {w.region}</div>
                </div>
                <ModerationBadge status={w.moderation} />
                {w.status === 'CLOSED' && <span className="badge bg-paper text-muted">closed</span>}
                {w.moderation === 'APPROVED' && w.status === 'OPEN' && (
                  <form action={closeWanted}>
                    <input type="hidden" name="wantedId" value={w.id} />
                    <button className="btn-ghost !px-3 !py-1.5 !text-[13px]">Close</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {listings.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-bold">No open requests right now.</p>
          <p className="mt-1 text-sm text-muted">Buyers post here when they need produce in bulk.</p>
          {(!user || user.role === 'BUYER') && (
            <Link href="/wanted/new" className="btn mt-4">Post the first request</Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {listings.map((w) => (
            <article
              key={w.id}
              className="card flex flex-col p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-8px_rgba(18,33,26,0.18)]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="badge bg-clay-light text-clay">Request</span>
                <span className="shrink-0 text-[11px] font-semibold text-muted">{timeAgo(w.createdAt)}</span>
              </div>
              <h2 className="mt-2.5 truncate text-lg font-extrabold tracking-tight">{w.productName}</h2>
              <p className="font-num text-[15px] font-bold text-clay">{w.quantity}</p>

              <dl className="my-3.5 space-y-2 text-[13px]">
                <div className="flex items-center gap-2">
                  <dt><PinIcon className="h-4 w-4 shrink-0 text-muted" /></dt>
                  <dd className="truncate font-semibold text-ink">{w.town}, {w.region}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt><CalendarIcon className="h-4 w-4 shrink-0 text-muted" /></dt>
                  <dd className="font-semibold text-ink">
                    {w.neededBy
                      ? `Needed by ${w.neededBy.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                      : 'Ongoing need'}
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt><StoreIcon className="h-4 w-4 shrink-0 text-muted" /></dt>
                  <dd className="truncate font-semibold text-ink">{w.buyer.businessName}</dd>
                </div>
              </dl>

              <p className="line-clamp-2 flex-1 border-t border-line pt-3 text-[13.5px] text-muted">{w.description}</p>
              {user ? (
                <WhatsAppButton
                  href={whatsappWantedLink(w.buyer.whatsapp, w.productName)}
                  label="Contact buyer"
                  className="mt-3 w-full"
                />
              ) : (
                <ContactPrompt message="Sign in to contact this buyer." className="mt-3" />
              )}
            </article>
          ))}
        </div>
      )}

      <Pagination page={page} pages={pages} basePath="/wanted" searchParams={searchParams} />
    </>
  );
}
