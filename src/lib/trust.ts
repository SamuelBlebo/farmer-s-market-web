import type { VerificationStatus } from '@prisma/client';

export type TrustInputs = {
  verification: VerificationStatus;
  lastActiveAt: Date | null;
  activeListings: number;
  followers: number;
  memberSince: Date;
};

/**
 * Every point here comes from a real, already-tracked signal — no invented
 * metrics. Weights (of 100): verification 40, recent activity 20, active
 * listings 20 (2 pts each, capped at 10 listings), followers 10 (1 pt each,
 * capped at 10), tenure 10 (1 pt per month on the platform, capped at 10).
 */
export function computeTrustScore(input: TrustInputs): number {
  let score = 0;

  if (input.verification === 'VERIFIED') score += 40;
  else if (input.verification === 'PENDING') score += 15;

  if (input.lastActiveAt) {
    const hours = (Date.now() - input.lastActiveAt.getTime()) / 3_600_000;
    if (hours < 24) score += 20;
    else if (hours < 24 * 7) score += 12;
    else if (hours < 24 * 30) score += 5;
  }

  score += Math.min(input.activeListings * 2, 20);
  score += Math.min(input.followers, 10);

  const months = (Date.now() - input.memberSince.getTime()) / (30 * 86_400_000);
  score += Math.min(Math.floor(months), 10);

  return Math.round(Math.min(score, 100));
}

export function trustLabel(score: number): string {
  if (score >= 85) return 'Highly Trusted Farm';
  if (score >= 70) return 'Trusted Farm';
  if (score >= 50) return 'Established Farm';
  return 'New Farm';
}
