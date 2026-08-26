import { InfoTooltip } from './info-tooltip';
import { trustLabel } from '@/lib/trust';

export function TrustScoreBadge({ score, className = '' }: { score: number; className?: string }) {
  return (
    <span className={`badge inline-flex items-center gap-1.5 bg-leaf-light text-leaf-dark ${className}`}>
      <span aria-hidden>🛡️</span>
      {score}/100 {trustLabel(score)}
      <InfoTooltip text="Based on verification, activity, and marketplace reputation." />
    </span>
  );
}
