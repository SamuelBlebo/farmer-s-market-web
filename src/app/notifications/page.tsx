import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheckIcon, BellIcon, ChatIcon, FlagIcon, WarningIcon } from '@/components/icons';
import { timeAgo } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/server/authz';
import { getNotifications } from '@/server/queries';
import { markAllNotificationsRead } from '@/server/notifications';
import {
  type FeedItem,
  type FeedItemKind,
  getAdminNotificationFeed,
  getBuyerAttentionFeed,
  getFarmerNotificationFeed,
} from '@/server/notification-feed';

const KIND_ICON: Record<FeedItemKind, React.ReactNode> = {
  moderation: <BellIcon className="h-4 w-4" />,
  report: <FlagIcon className="h-4 w-4" />,
  farmer: <BadgeCheckIcon className="h-4 w-4" />,
  chat: <ChatIcon className="h-4 w-4" />,
  support: <ChatIcon className="h-4 w-4" />,
  rejected: <WarningIcon className="h-4 w-4" />,
};

function FeedRow({ item }: { item: FeedItem }) {
  return (
    <Link href={item.href} className="flex items-center gap-3 p-3.5 transition-colors hover:bg-paper">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-leaf-light text-leaf-dark">
        {KIND_ICON[item.kind]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{item.message}</p>
        {item.subtext && <p className="truncate text-[12.5px] text-muted">{item.subtext}</p>}
        <p className="text-[12px] text-muted">{timeAgo(item.createdAt)}</p>
      </div>
    </Link>
  );
}

function EmptyState({ note }: { note: string }) {
  return (
    <div className="card p-10 text-center">
      <BellIcon className="mx-auto h-7 w-7 text-muted" />
      <p className="mt-1 font-bold">You&apos;re all caught up.</p>
      <p className="mt-1 text-sm text-muted">{note}</p>
    </div>
  );
}

export default async function NotificationsPage() {
  const user = await requireUser();

  if (user.role === 'ADMIN') {
    const feed = await getAdminNotificationFeed();
    return (
      <>
        <p className="eyebrow">Admin</p>
        <h1 className="mb-4 mt-1 text-2xl font-bold tracking-tight">Notifications</h1>
        {feed.length === 0 ? (
          <EmptyState note="No pending listings, requests, reports, new farmers, or support messages." />
        ) : (
          <div className="card divide-y divide-line">
            {feed.map((item) => <FeedRow key={item.id} item={item} />)}
          </div>
        )}
      </>
    );
  }

  if (user.role === 'FARMER') {
    const profile = await prisma.farmerProfile.findUniqueOrThrow({ where: { userId: user.id } });
    const feed = await getFarmerNotificationFeed(user.id, profile.id);
    return (
      <>
        <p className="eyebrow">Notifications</p>
        <h1 className="mb-4 mt-1 text-2xl font-bold tracking-tight">Notifications</h1>
        {feed.length === 0 ? (
          <EmptyState note="Rejected listings, new buyer messages, and support replies will show up here." />
        ) : (
          <div className="card divide-y divide-line">
            {feed.map((item) => <FeedRow key={item.id} item={item} />)}
          </div>
        )}
      </>
    );
  }

  // BUYER — real per-item read tracking for farm-follow updates (existing
  // Notification rows), plus the same kind of live "needs attention" feed
  // the other two roles get, for rejected requests / chat / support.
  const profile = await prisma.buyerProfile.findUniqueOrThrow({ where: { userId: user.id } });
  const [attentionFeed, notifications] = await Promise.all([
    getBuyerAttentionFeed(user.id, profile.id),
    getNotifications(user.id),
  ]);
  await markAllNotificationsRead(user.id);

  return (
    <>
      <p className="eyebrow">Notifications</p>
      <h1 className="mb-1 mt-1 text-2xl font-bold tracking-tight">Notifications</h1>

      {attentionFeed.length === 0 && notifications.length === 0 ? (
        <EmptyState note="Follow a farm to hear about new listings and harvests." />
      ) : (
        <>
          {attentionFeed.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold tracking-tight">Needs your attention</h2>
              <div className="card divide-y divide-line">
                {attentionFeed.map((item) => <FeedRow key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {notifications.length > 0 && (
            <div>
              <h2 className="mb-2 text-lg font-semibold tracking-tight">Farms you follow</h2>
              <div className="card divide-y divide-line">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.product ? `/products/${n.product.id}` : '/'}
                    className="flex items-center gap-3 p-3.5 transition-colors hover:bg-paper"
                  >
                    <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[8px] bg-gradient-to-br from-[#E9F1E9] to-[#D6E5D8] text-lg">
                      {n.product?.images[0] ? (
                        <Image src={n.product.images[0].url} alt="" fill sizes="40px" className="object-cover" />
                      ) : (
                        <BellIcon className="h-4 w-4 text-leaf-dark" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{n.message}</p>
                      <p className="text-[12px] text-muted">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-leaf" aria-label="Unread" />}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
