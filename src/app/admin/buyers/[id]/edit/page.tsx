import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AdminResetPasswordButton } from '@/components/admin-reset-password-button';
import { ChatIcon } from '@/components/icons';
import { ProfileForm } from '@/components/profile-form';
import { SubmitButton } from '@/components/submit-button';
import { lastActiveLabel } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/server/authz';
import { messageUserFromAdmin, updateBuyerProfileAsAdmin } from '@/server/actions/admin';

export default async function AdminEditBuyerPage({ params }: { params: { id: string } }) {
  await requireAdmin();

  const [buyer, requestCount] = await Promise.all([
    prisma.buyerProfile.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, name: true, email: true, image: true, createdAt: true, lastActiveAt: true } } },
    }),
    prisma.wantedListing.count({ where: { buyerId: params.id, status: { not: 'CLOSED' } } }),
  ]);
  if (!buyer) notFound();

  const action = updateBuyerProfileAsAdmin.bind(null, buyer.id);

  return (
    <div className="mx-auto max-w-[640px]">
      <Link href="/admin#buyers" className="btn-ghost mb-4">← Back to admin</Link>

      <p className="eyebrow">Buyer</p>
      <h1 className="mb-4 mt-1 text-2xl font-bold tracking-tight">{buyer.businessName}</h1>

      <div className="card mb-4 grid grid-cols-3 gap-3 p-4">
        <div>
          <div className="font-num text-lg font-bold">{requestCount}</div>
          <p className="text-[12.5px] text-muted">Open requests</p>
        </div>
        <div>
          <div className="text-sm font-bold">{lastActiveLabel(buyer.user.lastActiveAt)}</div>
          <p className="text-[12.5px] text-muted">Activity</p>
        </div>
        <div>
          <div className="text-sm font-bold">{buyer.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <p className="text-[12.5px] text-muted">Joined</p>
        </div>
      </div>

      <div className="card mb-4 flex flex-wrap items-center gap-2 p-4">
        <form action={messageUserFromAdmin}>
          <input type="hidden" name="userId" value={buyer.user.id} />
          <SubmitButton pendingLabel="Opening…" className="btn-ghost inline-flex items-center gap-1.5 !px-3 !py-1.5 !text-[13px]">
            <ChatIcon className="h-3.5 w-3.5" /> Message
          </SubmitButton>
        </form>
        <AdminResetPasswordButton userId={buyer.user.id} />
      </div>

      <ProfileForm
        role="BUYER"
        action={action}
        initial={{
          name: buyer.user.name,
          phone: buyer.phone,
          email: buyer.user.email,
          image: buyer.user.image,
          businessName: buyer.businessName,
        }}
      />
    </div>
  );
}
