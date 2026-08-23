import type { ProductStatus, VerificationStatus } from '@prisma/client';

export function VerifiedBadge({ status }: { status: VerificationStatus }) {
  if (status === 'VERIFIED')
    return <span className="badge bg-leaf-light text-leaf-dark">✓ Verified</span>;
  if (status === 'PENDING')
    return <span className="badge bg-gold-light text-[#8A6100]">Pending</span>;
  return <span className="badge bg-paper text-muted">Unverified</span>;
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
