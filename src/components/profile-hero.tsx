import Link from 'next/link';
import type { VerificationStatus } from '@prisma/client';
import { VerifiedBadge } from './badges';

export function ProfileHero({
  avatarUrl,
  avatarLetter,
  name,
  roleLabel,
  verification,
  region,
  memberSince,
  lastActive,
}: {
  avatarUrl?: string | null;
  avatarLetter: string;
  name: string;
  roleLabel: string;
  /** Farmers only — buyers/admins have no verification concept in this app. */
  verification?: VerificationStatus;
  region?: string;
  memberSince: string;
  lastActive: string;
}) {
  return (
    <div className="card mb-4 rounded-2xl p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-leaf-light text-3xl font-extrabold text-leaf-dark">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            avatarLetter
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="badge bg-paper text-muted">{roleLabel}</span>
            {verification && <VerifiedBadge status={verification} />}
            {region && <span className="text-[13px] text-muted">{region}</span>}
          </div>
          <p className="mt-2 text-[13px] text-muted">
            Member since {memberSince} · {lastActive}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link href="/account/edit" className="btn sm:flex-1">Edit Profile</Link>
        <Link href="/account/password" className="btn-ghost sm:flex-1">Change Password</Link>
      </div>
    </div>
  );
}
