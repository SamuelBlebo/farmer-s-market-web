'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FollowButton } from './follow-button';
import { TrustScoreBadge } from './trust-score-badge';
import { VerifiedBadge } from './badges';

const LONG_PRESS_MS = 500;

type Preview = {
  farmerId: string;
  farmerUserId: string;
  farmName: string;
  avatarUrl: string | null;
  region: string;
  verification: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  activeListings: number;
  trustScore: number;
  isFollowing: boolean;
  canFollow: boolean;
  signedIn: boolean;
};

/** Hover (desktop) or long-press (mobile) on a card's farmer name reveals this compact preview. */
export function FarmerPreviewTrigger({ farmerId, farmerName }: { farmerId: string; farmerName: string }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout>>();

  async function load() {
    if (preview) return;
    try {
      const res = await fetch(`/api/farmers/${farmerId}/preview`);
      if (res.ok) setPreview(await res.json());
    } catch {
      // Preview is a nice-to-have; silently do nothing on failure.
    }
  }

  function onTouchStart() {
    pressTimer.current = setTimeout(() => {
      load();
      setOpen(true);
    }, LONG_PRESS_MS);
  }
  function cancelPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }

  return (
    <span
      className="relative inline-block max-w-full"
      onMouseEnter={() => {
        load();
        setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onClick={(e) => e.preventDefault()}
    >
      <span className="truncate underline decoration-dotted underline-offset-2">{farmerName}</span>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full right-0 z-30 mb-2 w-64 rounded-2xl border border-line bg-white p-3.5 text-left shadow-md"
        >
          {!preview ? (
            <p className="p-2 text-center text-[13px] text-muted">Loading…</p>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-leaf-light font-extrabold text-leaf-dark">
                  {preview.avatarUrl ? (
                    <Image src={preview.avatarUrl} alt="" fill sizes="40px" className="object-cover" />
                  ) : (
                    preview.farmName[0]
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold">{preview.farmName}</span>
                    <VerifiedBadge status={preview.verification} />
                  </div>
                  <p className="text-[12px] text-muted">{preview.region}</p>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[12.5px] text-muted">
                <TrustScoreBadge score={preview.trustScore} />
                <span>{preview.activeListings} listing{preview.activeListings === 1 ? '' : 's'}</span>
              </div>

              <div className="mt-3">
                {preview.canFollow ? (
                  <FollowButton
                    farmerUserId={preview.farmerUserId}
                    storefrontPath={`/farmers/${preview.farmerId}`}
                    initialFollowing={preview.isFollowing}
                    className="w-full !py-1.5 !text-[12.5px]"
                  />
                ) : (
                  <Link href={`/farmers/${preview.farmerId}`} className="btn-ghost block w-full !py-1.5 !text-[12.5px]">
                    View storefront
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </span>
  );
}
