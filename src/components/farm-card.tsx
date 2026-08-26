import Link from 'next/link';
import Image from 'next/image';
import type { VerificationStatus } from '@prisma/client';
import { VerifiedBadge } from './badges';
import { lastActiveLabel } from '@/lib/format';

type Farm = {
  id: string;
  farmName: string;
  coverImage: string | null;
  avatarUrl: string | null;
  verification: VerificationStatus;
  region: string;
  town: string;
  lastActiveAt: Date | null;
  activeListings: number;
};

/** Saved Farms card — the storefront hero's cover+avatar treatment, condensed. */
export function FarmCard({ farm }: { farm: Farm }) {
  return (
    <Link href={`/farmers/${farm.id}`} className="card block overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-16 w-full bg-gradient-to-br from-[#E9F1E9] to-[#D6E5D8]">
        {farm.coverImage && <Image src={farm.coverImage} alt="" fill sizes="(max-width:768px) 50vw, 240px" className="object-cover" />}
      </div>
      <div className="p-3">
        <div className="relative -mt-9 mb-1.5 grid h-12 w-12 place-items-center overflow-hidden rounded-full border-2 border-white bg-leaf-light text-lg font-extrabold text-leaf-dark shadow-sm">
          {farm.avatarUrl ? (
            <Image src={farm.avatarUrl} alt="" fill sizes="48px" className="object-cover" />
          ) : (
            farm.farmName[0]
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="truncate font-bold">{farm.farmName}</span>
          <VerifiedBadge status={farm.verification} />
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-muted">{farm.town}, {farm.region}</p>
        <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-[12px] text-muted">
          <span className="truncate">{lastActiveLabel(farm.lastActiveAt)}</span>
          <span className="shrink-0">{farm.activeListings} listing{farm.activeListings === 1 ? '' : 's'}</span>
        </div>
      </div>
    </Link>
  );
}
