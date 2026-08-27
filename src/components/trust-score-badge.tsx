import { ShieldIcon } from './icons';
import { InfoTooltip } from './info-tooltip';
import { trustLabel } from '@/lib/trust';

export function TrustScoreBadge({ score, className = '' }: { score: number; className?: string }) {
  return (
    <span className={`badge inline-flex items-center gap-1.5 bg-leaf-light text-leaf-dark ${className}`}>
      <ShieldIcon className="h-3.5 w-3.5" />
      {score}/100 {trustLabel(score)}
      <InfoTooltip text="Based on verification, activity, and marketplace reputation." />
    </span>
  );
}
