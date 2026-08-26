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
  /** Overrides the h1 (e.g. a "Welcome back, Kofi 👋" greeting) — name is still used for the avatar's fallback letter. */
  heading?: string;
  roleLabel: string;
  /** Farmers only — buyers/admins have no verification concept in this app. */
  verification?: VerificationStatus;
  region?: string;
  memberSince: string;
  lastActive: string;
  /** Optional row of quick-glance chips (e.g. "🌱 4 Active listings") between the meta line and the actions. */
  summary?: React.ReactNode;
  /** Overrides the default Edit Profile / Change Password button pair. */
  actions?: React.ReactNode;
}) {
  return (
    <div className="card mb-4 overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-md">
      {coverImage && (
        <div className="h-32 w-full bg-gradient-to-br from-[#E9F1E9] to-[#D6E5D8] sm:h-44">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImage} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="p-5 sm:p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div
            className={`grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-leaf-light text-3xl font-extrabold text-leaf-dark ${
              coverImage ? '-mt-14 border-4 border-white shadow-sm sm:-mt-16' : ''
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
            <h1 className="text-2xl font-bold tracking-tight">{heading ?? name}</h1>
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

        {summary && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-line pt-4 sm:justify-start">
            {summary}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
