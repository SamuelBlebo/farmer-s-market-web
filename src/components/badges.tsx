import type { ModerationStatus, ProductStatus, VerificationStatus } from '@prisma/client';
import { CheckIcon } from './icons';
import { LIFECYCLE_LABEL, type ProductLifecycle } from '@/lib/format';

export function VerifiedBadge({ status, large = false }: { status: VerificationStatus; large?: boolean }) {
  const size = large ? 'px-3 py-1 text-[13px]' : '';
  if (status === 'VERIFIED')
    return (
      <span className={`badge bg-leaf-light text-leaf-dark ${size}`}>
        <CheckIcon className={large ? 'h-3.5 w-3.5' : 'h-3 w-3'} /> Verified
      </span>
    );
  if (status === 'PENDING')
    return <span className={`badge bg-gold-light text-[#8A6100] ${size}`}>Pending</span>;
  return <span className={`badge bg-paper text-muted ${size}`}>Unverified</span>;
}

export function LifecycleBadge({ lifecycle }: { lifecycle: ProductLifecycle }) {
  const map: Record<ProductLifecycle, string> = {
    ONGOING: 'bg-leaf-light text-leaf-dark',
    UPCOMING_HARVEST: 'bg-gold-light text-[#8A6100]',
    AVAILABLE_NOW: 'bg-leaf-light text-leaf-dark',
    SOLD_OUT: 'bg-clay-light text-clay',
    PAUSED: 'bg-paper text-muted',
  };
  return <span className={`badge ${map[lifecycle]}`}>{LIFECYCLE_LABEL[lifecycle]}</span>;
}

export function StatusBadge({ status }: { status: ProductStatus }) {
  const map: Record<ProductStatus, string> = {
    ACTIVE: 'bg-leaf-light text-leaf-dark',
    PAUSED: 'bg-paper text-muted',
    SOLD: 'bg-clay-light text-clay',
    REMOVED: 'bg-clay-light text-clay',
  };
  return <span className={`badge ${map[status]}`}>{status.toLowerCase()}</span>;
}

export function ModerationBadge({ status }: { status: ModerationStatus }) {
  if (status === 'APPROVED') return <span className="badge bg-leaf-light text-leaf-dark">Approved</span>;
  if (status === 'REJECTED') return <span className="badge bg-clay-light text-clay">Rejected</span>;
  return <span className="badge bg-gold-light text-[#8A6100]">Pending review</span>;
}
