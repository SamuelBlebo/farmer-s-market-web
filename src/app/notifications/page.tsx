import Link from 'next/link';
import Image from 'next/image';
import { BellIcon } from '@/components/icons';
import { timeAgo } from '@/lib/format';
import { requireUser } from '@/server/authz';
import { getNotifications } from '@/server/queries';
import { markAllNotificationsRead } from '@/server/notifications';

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await getNotifications(user.id);
  await markAllNotificationsRead(user.id);

  return (
    <>
      <p className="eyebrow">Notifications</p>
      <h1 className="mb-4 mt-1 text-2xl font-bold tracking-tight">Farms you follow</h1>

      {notifications.length === 0 ? (
        <div className="card p-10 text-center">
          <BellIcon className="mx-auto h-7 w-7 text-muted" />
          <p className="mt-1 font-bold">You&apos;re all caught up.</p>
          <p className="mt-1 text-sm text-muted">Follow a farm to hear about new listings and harvests.</p>
        </div>
      ) : (
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
      )}
    </>
  );
}
