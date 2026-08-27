import Link from 'next/link';
import type { VerificationStatus } from '@prisma/client';
import { VerifiedBadge } from './badges';

export function ProfileHero({
  coverImage,
  avatarUrl,
  avatarLetter,
  name,
  heading,
  roleLabel,
  verification,
  region,
  memberSince,
  lastActive,
  summary,
  actions,
}: {
  /** Public storefront only — the account hub never passes this. */
  coverImage?: string | null;
  avatarUrl?: string | null;
  avatarLetter: string;
  name: string;
  /** Overrides the h1 (e.g. a "Welcome back, Kofi" greeting) — name is still used for the avatar's fallback letter. */
  heading?: string;
  roleLabel: string;
  /** Farmers only — buyers/admins have no verification concept in this app. */
  verification?: VerificationStatus;
  region?: string;
  memberSince: string;
  lastActive: string;
  /** Optional row of quick-glance chips (e.g. "4 Active listings") between the meta line and the actions. */
  summary?: React.ReactNode;
  /** Overrides the default Edit Profile / Change Password button pair. */
  actions?: React.ReactNode;
}) {
  return (
    <div className="card mb-4 overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-md">
      {coverImage && (
        <div className="h-20 w-full bg-gradient-to-br from-[#E9F1E9] to-[#D6E5D8] sm:h-28">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImage} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
          <div
            className={`grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-leaf-light text-2xl font-extrabold text-leaf-dark ${
              coverImage ? '-mt-8 border-4 border-white shadow-sm sm:-mt-10' : ''
            }`}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              avatarLetter
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight">{heading ?? name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="badge bg-paper text-muted">{roleLabel}</span>
              {verification && <VerifiedBadge status={verification} />}
              {region && <span className="text-[13px] text-muted">{region}</span>}
            </div>
            <p className="mt-1.5 text-[13px] text-muted">
              Member since {memberSince} · {lastActive}
            </p>
          </div>
        </div>

        {summary && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-line pt-3 sm:justify-start">
            {summary}
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          {actions ?? (
            <>
              <Link href="/account/edit" className="btn sm:flex-1">Edit Profile</Link>
              <Link href="/account/password" className="btn-ghost sm:flex-1">Change Password</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
