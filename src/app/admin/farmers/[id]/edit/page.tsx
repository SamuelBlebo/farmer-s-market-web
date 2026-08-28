import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AdminResetPasswordButton } from '@/components/admin-reset-password-button';
import { VerifiedBadge } from '@/components/badges';
import { ChatIcon, StarIcon } from '@/components/icons';
import { ProfileForm } from '@/components/profile-form';
import { lastActiveLabel } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/server/authz';
import { messageUserFromAdmin, setFarmerVerification, updateFarmerProfileAsAdmin } from '@/server/actions/admin';

export default async function AdminEditFarmerPage({ params }: { params: { id: string } }) {
  await requireAdmin();

  const [farmer, ratingStats, productCount] = await Promise.all([
    prisma.farmerProfile.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, name: true, email: true, image: true, createdAt: true, lastActiveAt: true } } },
    }),
    prisma.review.aggregate({
      where: { farmerId: params.id, moderation: 'APPROVED' },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.product.count({ where: { farmerId: params.id, status: { not: 'REMOVED' } } }),
  ]);
  if (!farmer) notFound();

  const action = updateFarmerProfileAsAdmin.bind(null, farmer.id);

  return (
    <div className="mx-auto max-w-[640px]">
      <Link href="/admin#farmer-verification" className="btn-ghost mb-4">← Back to admin</Link>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="eyebrow">Farmer</p>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{farmer.farmName}</h1>
        <VerifiedBadge status={farmer.verification} precise />
      </div>

      <div className="card mb-4 grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        <div>
          <div className="font-num text-lg font-bold">{productCount}</div>
          <p className="text-[12.5px] text-muted">Listings</p>
        </div>
        <div>
          <div className="font-num inline-flex items-center gap-1 text-lg font-bold">
            <StarIcon className="h-4 w-4 text-gold" filled /> {(ratingStats._avg.rating ?? 0).toFixed(1)}
          </div>
          <p className="text-[12.5px] text-muted">{ratingStats._count} review{ratingStats._count === 1 ? '' : 's'}</p>
        </div>
        <div>
          <div className="text-sm font-bold">{lastActiveLabel(farmer.user.lastActiveAt)}</div>
          <p className="text-[12.5px] text-muted">Activity</p>
        </div>
        <div>
          <div className="text-sm font-bold">{farmer.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <p className="text-[12.5px] text-muted">Joined</p>
        </div>
      </div>

      <div className="card mb-4 flex flex-wrap items-center gap-2 p-4">
        <form action={messageUserFromAdmin}>
          <input type="hidden" name="userId" value={farmer.user.id} />
          <button className="btn-ghost inline-flex items-center gap-1.5 !px-3 !py-1.5 !text-[13px]">
            <ChatIcon className="h-3.5 w-3.5" /> Message
          </button>
        </form>
        <form action={setFarmerVerification}>
          <input type="hidden" name="farmerId" value={farmer.id} />
          {farmer.verification !== 'VERIFIED' ? (
            <button name="status" value="VERIFIED" className="btn !px-3 !py-1.5 !text-[13px]">Mark verified</button>
          ) : (
            <button name="status" value="UNVERIFIED" className="btn-ghost !px-3 !py-1.5 !text-[13px]">Remove badge</button>
          )}
        </form>
        <AdminResetPasswordButton userId={farmer.user.id} />
        <Link href={`/farmers/${farmer.id}`} className="btn-ghost !px-3 !py-1.5 !text-[13px]">View storefront</Link>
      </div>

      <ProfileForm
        role="FARMER"
        action={action}
        initial={{
          name: farmer.user.name,
          phone: farmer.phone,
          email: farmer.user.email,
          image: farmer.user.image,
          region: farmer.region,
          town: farmer.town,
          businessName: farmer.farmName,
          coverImage: farmer.coverImage,
          description: farmer.description,
        }}
      />
    </div>
  );
}
