import { Suspense } from 'react';
import Link from 'next/link';
import { ActionBanner } from '@/components/action-banner';
import { VerifiedBadge } from '@/components/badges';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/server/authz';
import { logout } from '@/server/actions/auth';

const ROLE_LABEL = { FARMER: 'Farmer', BUYER: 'Buyer', ADMIN: 'Admin' } as const;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-bold">{value}</dd>
    </div>
  );
}

export default async function AccountPage() {
  const user = await requireUser();

  const [dbUser, farmerProfile, buyerProfile] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
    user.role === 'FARMER' ? prisma.farmerProfile.findUnique({ where: { userId: user.id } }) : null,
    user.role === 'BUYER' ? prisma.buyerProfile.findUnique({ where: { userId: user.id } }) : null,
  ]);

  const memberSince = dbUser.createdAt.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

  return (
    <div className="mx-auto max-w-[480px]">
      <Suspense>
        <ActionBanner messages={{ saved: 'Profile updated.', passwordChanged: 'Password changed.' }} />
      </Suspense>

      <div className={`mb-5 text-center ${user.role === 'ADMIN' ? 'rounded-[10px] border-2 border-ink p-4' : ''}`}>
        <div className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-leaf-light text-2xl font-extrabold text-leaf-dark">
          {dbUser.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dbUser.image} alt="" className="h-full w-full object-cover" />
          ) : (
            dbUser.name[0]
          )}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">{dbUser.name}</h1>
        <p className="text-muted">{ROLE_LABEL[user.role]}</p>
      </div>

      <dl className="card divide-y divide-line">
        <Row label="Phone" value={dbUser.phone} />
        {dbUser.email && <Row label="Email" value={dbUser.email} />}
        {farmerProfile && <Row label="Region" value={farmerProfile.region} />}
        {farmerProfile && <Row label="Town" value={farmerProfile.town} />}
        {farmerProfile && <Row label="Verification" value={<VerifiedBadge status={farmerProfile.verification} />} />}
        {buyerProfile && <Row label="Business" value={buyerProfile.businessName} />}
        <Row label="Member since" value={memberSince} />
      </dl>

      <div className="mt-4 flex flex-col gap-2">
        <Link href="/account/edit" className="btn w-full">Edit profile</Link>
        <Link href="/account/password" className="btn-ghost w-full">Change password</Link>
        {user.role === 'FARMER' && <Link href="/dashboard" className="btn-ghost w-full">Farmer dashboard</Link>}
        <form action={logout}>
          <button className="btn-ghost w-full">Sign out</button>
        </form>
      </div>
    </div>
  );
}
